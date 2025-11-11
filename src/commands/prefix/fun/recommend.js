import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { googleBooksAPI, aniListAPI } from '../../../utils/apiClients.js';
import logger from '../../../utils/logger.js';

export const name = 'recommend';
export const description = 'Get reading recommendations';

export async function run(message, args) {
  const type = args[0]?.toLowerCase() || 'mixed';
  const genre = args[1]?.toLowerCase();

  const validTypes = ['book', 'manga', 'webtoon', 'comic', 'lightnovel', 'mixed'];
  if (!validTypes.includes(type)) {
    return message.reply({
      embeds: [errorEmbed('Invalid Type', `Valid types: ${validTypes.join(', ')}`)]
    });
  }

  try {
    let recommendations = [];

    // Popular titles for each type
    const popularTitles = {
      book: ['Harry Potter and the Sorcerer\'s Stone', 'The Lord of the Rings', 'The Hobbit', '1984', 'To Kill a Mockingbird', 'Pride and Prejudice', 'The Great Gatsby', 'Moby-Dick', 'War and Peace', 'Crime and Punishment'],
      manga: ['One Piece', 'Naruto', 'Bleach', 'Dragon Ball', 'Attack on Titan', 'Death Note', 'Fullmetal Alchemist', 'My Hero Academia', 'Demon Slayer', 'Tokyo Ghoul'],
      webtoon: ['Tower of God', 'Sweet Guy', 'The God of High School', 'Unordinary', 'Lore Olympus', 'True Beauty', 'Who Made Me a Princess', 'The Remarried Empress', 'Drug Candy', 'Let\'s Get a Divorce'],
      comic: ['Batman: The Killing Joke', 'Watchmen', 'The Dark Knight Returns', 'Spider-Man: Blue', 'X-Men: Dark Phoenix Saga', 'Wonder Woman: Earth One', 'Superman: Red Son', 'The Avengers', 'Iron Man: Extremis', 'Captain America: Winter Soldier'],
      lightnovel: ['Overlord', 'The Rising of the Shield Hero', 'That Time I Got Reincarnated as a Slime', 'No Game No Life', 'Sword Art Online', 'Konosuba', 'The Irregular at Magic High School', 'A Certain Magical Index', 'High School DxD', 'Log Horizon']
    };

    if (type === 'mixed') {
      // For mixed, pick from all types
      const allTitles = Object.values(popularTitles).flat();
      const selectedTitles = [];
      for (let i = 0; i < 5; i++) {
        const randomTitle = allTitles[Math.floor(Math.random() * allTitles.length)];
        if (!selectedTitles.includes(randomTitle)) {
          selectedTitles.push(randomTitle);
        }
      }

      for (const title of selectedTitles) {
        // Try to get info for each title
        try {
          const data = await googleBooksAPI.searchBooks(title);
          if (data && data.items && data.items.length > 0) {
            const book = data.items[0].volumeInfo;
            recommendations.push({
              title: book.title,
              author: book.authors ? book.authors.join(', ') : 'Unknown',
              type: 'book',
              description: book.description ? book.description.slice(0, 100) : null,
            });
          }
        } catch (error) {
          // Try AniList
          try {
            const results = await aniListAPI.searchManga(title);
            if (results && results.length > 0) {
              const manga = results[0];
              recommendations.push({
                title: manga.title.english || manga.title.romaji,
                author: 'Various',
                type: 'manga',
                description: manga.description ? manga.description.slice(0, 100) : null,
              });
            }
          } catch (error) {
            // Skip if both fail
          }
        }
      }
    } else {
      const titles = popularTitles[type] || popularTitles.book;
      const selectedTitles = [];
      for (let i = 0; i < 5; i++) {
        const randomTitle = titles[Math.floor(Math.random() * titles.length)];
        if (!selectedTitles.includes(randomTitle)) {
          selectedTitles.push(randomTitle);
        }
      }

      for (const title of selectedTitles) {
        if (type === 'book' || type === 'comic') {
          const data = await googleBooksAPI.searchBooks(title);
          if (data && data.items && data.items.length > 0) {
            const book = data.items[0].volumeInfo;
            recommendations.push({
              title: book.title,
              author: book.authors ? book.authors.join(', ') : 'Unknown',
              type: type,
              description: book.description ? book.description.slice(0, 100) : null,
            });
          }
        } else {
          // For manga, webtoon, lightnovel
          const results = type === 'lightnovel' ? await aniListAPI.searchLightNovel(title) : await aniListAPI.searchManga(title);
          if (results && results.length > 0) {
            const item = results[0];
            recommendations.push({
              title: item.title.english || item.title.romaji,
              author: 'Various',
              type: type,
              description: item.description ? item.description.slice(0, 100) : null,
            });
          }
        }
      }
    }

    if (recommendations.length === 0) {
      return message.reply({
        embeds: [errorEmbed('No Recommendations', 'Could not find recommendations for the specified criteria.')]
      });
    }

    const formattedRecs = recommendations.map((rec, index) => {
      return `${index + 1}. **${rec.title}**\n   Author: ${rec.author || 'Unknown'}\n   Type: ${rec.type}\n   ${rec.description ? `Description: ${rec.description}...` : ''}`;
    }).join('\n\n');

    const titleText = genre ? `${genre.charAt(0).toUpperCase() + genre.slice(1)} ${type} Recommendations` : `${type.charAt(0).toUpperCase() + type.slice(1)} Recommendations`;

    await message.reply({
      embeds: [successEmbed(titleText, formattedRecs)]
    });

    logger.info(`User ${message.author.username} requested ${type} recommendations${genre ? ` for ${genre}` : ''}`);
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to get recommendations. Please try again.')]
    });
  }
}
