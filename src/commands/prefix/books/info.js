import { bookInfoEmbed, errorEmbed } from '../../../utils/embeds.js';
import { googleBooksAPI, aniListAPI, mangaDexAPI } from '../../../utils/apiClients.js';
import logger from '../../../utils/logger.js';

export const name = 'info';
export const description = 'Get information about a title';

export async function run(message, args) {
  if (args.length === 0) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage: `!info <title>`')]
    });
  }

  const title = args.join(' ');

  try {
    // Try different APIs based on common patterns
    let info;
    let source = '';

    // First try Google Books (for books)
    try {
      const bookData = await googleBooksAPI.searchBooks(title);
      if (bookData && bookData.items && bookData.items.length > 0) {
        const book = bookData.items[0].volumeInfo;
        info = {
          title: book.title,
          author: book.authors ? book.authors.join(', ') : 'Unknown',
          description: book.description,
          cover: book.imageLinks ? book.imageLinks.thumbnail : null,
          type: 'book',
        };
        source = 'Google Books';
      }
    } catch (error) {
      // Try AniList for manga
      try {
        const results = await aniListAPI.searchManga(title);
        if (results && results.length > 0) {
          const manga = results[0];
          info = {
            title: manga.title.english || manga.title.romaji,
            author: 'Various', // AniList doesn't provide author easily
            description: manga.description,
            cover: manga.coverImage.large,
            type: 'manga',
            totalChapters: manga.chapters,
          };
          source = 'AniList';
        } else {
          // Fallback to MangaDex
          const results = await mangaDexAPI.searchManga(title);
          if (results && results.length > 0) {
            const manga = results[0];
            info = {
              title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
              author: 'Various',
              description: manga.attributes.description?.en || 'No description available',
              cover: null, // MangaDex doesn't provide cover in basic search
              type: 'manga',
              totalChapters: null,
            };
            source = 'MangaDex';
          }
        }
      } catch (error) {
        // Try webtoon API
        try {
          info = await fetchWebtoonInfo(title);
          source = 'Webtoon';
        } catch (error) {
          // Try AniList for webtoon-like content
          try {
            const results = await aniListAPI.searchManga(`${title} webtoon`);
            if (results && results.length > 0) {
              const webtoon = results[0];
              info = {
                title: webtoon.title.english || webtoon.title.romaji,
                author: 'Various',
                description: webtoon.description,
                cover: webtoon.coverImage.large,
                type: 'webtoon',
                totalChapters: webtoon.chapters,
              };
              source = 'AniList';
            }
          } catch (error) {
            // Try Google Books for comics
            try {
              const data = await googleBooksAPI.searchBooks(`${title} comic`);
              if (data && data.items && data.items.length > 0) {
                const book = data.items[0].volumeInfo;
                info = {
                  title: book.title,
                  author: book.authors ? book.authors.join(', ') : 'Unknown',
                  description: book.description,
                  cover: book.imageLinks ? book.imageLinks.thumbnail : null,
                  type: 'comic',
                };
                source = 'Google Books';
              }
            } catch (error) {
              // Try AniList for light novels
              try {
                const results = await aniListAPI.searchLightNovel(title);
                if (results && results.length > 0) {
                  const novel = results[0];
                  info = {
                    title: novel.title.english || novel.title.romaji,
                    author: 'Various',
                    description: novel.description,
                    cover: novel.coverImage.large,
                    type: 'lightnovel',
                    totalChapters: novel.chapters,
                  };
                  source = 'AniList';
                }
              } catch (error) {
                return message.reply({
                  embeds: [errorEmbed('Not Found', `Could not find information for "${title}". Please check the spelling and try again.`)]
                });
              }
            }
          }
        }
      }
    }

    if (!info) {
      return message.reply({
        embeds: [errorEmbed('Not Found', `Could not find information for "${title}". Please check the spelling and try again.`)]
      });
    }

    await message.reply({
      embeds: [bookInfoEmbed(info)]
    });

    logger.info(`User ${message.author.username} requested info for "${title}" from ${source}`);
  } catch (error) {
    logger.error('Error fetching title info:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to fetch title information. Please try again.')]
    });
  }
}
