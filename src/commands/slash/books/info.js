import { SlashCommandBuilder } from 'discord.js';
import { googleBooksAPI, aniListAPI, mangaDexAPI } from '../../../utils/apiClients.js';
import { bookInfoEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Get information about a title')
  .addStringOption(option =>
    option.setName('title')
      .setDescription('The title to search for')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('type')
      .setDescription('Type of media')
      .addChoices(
        { name: 'Book', value: 'book' },
        { name: 'Manga', value: 'manga' },
        { name: 'Webtoon', value: 'webtoon' },
        { name: 'Comic', value: 'comic' },
        { name: 'Light Novel', value: 'lightnovel' }
      ));

export async function execute(interaction) {
  const title = interaction.options.getString('title');
  const type = interaction.options.getString('type') || 'book';

  await interaction.deferReply();

  try {
    let bookData = null;

    if (type === 'book') {
      const data = await googleBooksAPI.searchBooks(title);
      if (data && data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        bookData = {
          title: book.title,
          author: book.authors ? book.authors.join(', ') : 'Unknown',
          description: book.description,
          cover: book.imageLinks ? book.imageLinks.thumbnail : null,
          type: 'book',
          totalChapters: null,
        };
      }
    } else if (type === 'manga') {
      const results = await aniListAPI.searchManga(title);
      if (results && results.length > 0) {
        const manga = results[0];
        bookData = {
          title: manga.title.english || manga.title.romaji,
          author: 'Various', // AniList doesn't provide author easily
          description: manga.description,
          cover: manga.coverImage.large,
          type: 'manga',
          totalChapters: manga.chapters,
        };
      } else {
        // Fallback to MangaDex
        const results = await mangaDexAPI.searchManga(title);
        if (results && results.length > 0) {
          const manga = results[0];
          bookData = {
            title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
            author: 'Various',
            description: manga.attributes.description?.en || 'No description available',
            cover: null, // MangaDex doesn't provide cover in basic search
            type: 'manga',
            totalChapters: null,
          };
        }
      }
    } else if (type === 'webtoon') {
      // For webtoons, try AniList with webtoon search
      const results = await aniListAPI.searchManga(`${title} webtoon`);
      if (results && results.length > 0) {
        const webtoon = results[0];
        bookData = {
          title: webtoon.title.english || webtoon.title.romaji,
          author: 'Various',
          description: webtoon.description,
          cover: webtoon.coverImage.large,
          type: 'webtoon',
          totalChapters: webtoon.chapters,
        };
      }
    } else if (type === 'comic') {
      // For comics, try Google Books with comic-specific search
      const data = await googleBooksAPI.searchBooks(`${title} comic`);
      if (data && data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        bookData = {
          title: book.title,
          author: book.authors ? book.authors.join(', ') : 'Unknown',
          description: book.description,
          cover: book.imageLinks ? book.imageLinks.thumbnail : null,
          type: 'comic',
        };
      }
    } else if (type === 'lightnovel') {
      // For light novels, use AniList with novel format
      const results = await aniListAPI.searchLightNovel(title);
      if (results && results.length > 0) {
        const novel = results[0];
        bookData = {
          title: novel.title.english || novel.title.romaji,
          author: 'Various',
          description: novel.description,
          cover: novel.coverImage.large,
          type: 'lightnovel',
          totalChapters: novel.chapters,
        };
      }
    }

    if (!bookData) {
      return await interaction.editReply({
        embeds: [errorEmbed('Not Found', `Could not find information for "${title}". Try a different title or type.`)],
      });
    }

    const embed = bookInfoEmbed(bookData);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error fetching book info:', error);
    await interaction.editReply({
      embeds: [errorEmbed('Error', 'Failed to fetch information. Please try again.')],
    });
  }
}
