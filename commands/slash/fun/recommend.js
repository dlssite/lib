import { SlashCommandBuilder } from 'discord.js';
import { googleBooksAPI, aniListAPI } from '../../../utils/apiClients.js';
import { bookInfoEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('recommend')
  .setDescription('Get a random recommendation')
  .addStringOption(option =>
    option.setName('type')
      .setDescription('Type of media')
      .addChoices(
        { name: 'Book', value: 'book' },
        { name: 'Manga', value: 'manga' },
        { name: 'Webtoon', value: 'webtoon' },
        { name: 'Comic', value: 'comic' },
        { name: 'Light Novel', value: 'lightnovel' }
      ))
  .addStringOption(option =>
    option.setName('genre')
      .setDescription('Genre to filter by')
      .setRequired(false));

export async function execute(interaction) {
  const type = interaction.options.getString('type') || 'book';
  const genre = interaction.options.getString('genre');

  await interaction.deferReply();

  try {
    let recommendation = null;

    // Popular titles for each type
    const popularTitles = {
      book: ['Harry Potter and the Sorcerer\'s Stone', 'The Lord of the Rings', 'The Hobbit', '1984', 'To Kill a Mockingbird', 'Pride and Prejudice', 'The Great Gatsby', 'Moby-Dick', 'War and Peace', 'Crime and Punishment'],
      manga: ['One Piece', 'Naruto', 'Bleach', 'Dragon Ball', 'Attack on Titan', 'Death Note', 'Fullmetal Alchemist', 'My Hero Academia', 'Demon Slayer', 'Tokyo Ghoul'],
      webtoon: ['Tower of God', 'Sweet Guy', 'The God of High School', 'Unordinary', 'Lore Olympus', 'True Beauty', 'Who Made Me a Princess', 'The Remarried Empress', 'Drug Candy', 'Let\'s Get a Divorce'],
      comic: ['Batman: The Killing Joke', 'Watchmen', 'The Dark Knight Returns', 'Spider-Man: Blue', 'X-Men: Dark Phoenix Saga', 'Wonder Woman: Earth One', 'Superman: Red Son', 'The Avengers', 'Iron Man: Extremis', 'Captain America: Winter Soldier'],
      lightnovel: ['Overlord', 'The Rising of the Shield Hero', 'That Time I Got Reincarnated as a Slime', 'No Game No Life', 'Sword Art Online', 'Konosuba', 'The Irregular at Magic High School', 'A Certain Magical Index', 'High School DxD', 'Log Horizon']
    };

    const titles = popularTitles[type] || popularTitles.book;
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];

    if (type === 'book') {
      const data = await googleBooksAPI.searchBooks(randomTitle);
      if (data && data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        recommendation = {
          title: book.title,
          author: book.authors ? book.authors.join(', ') : 'Unknown',
          description: book.description,
          cover: book.imageLinks ? book.imageLinks.thumbnail : null,
          type: 'book',
        };
      }
    } else if (type === 'manga') {
      const results = await aniListAPI.searchManga(randomTitle);
      if (results && results.length > 0) {
        const manga = results[0];
        recommendation = {
          title: manga.title.english || manga.title.romaji,
          author: 'Various',
          description: manga.description,
          cover: manga.coverImage.large,
          type: 'manga',
          totalChapters: manga.chapters,
        };
      }
    } else if (type === 'webtoon') {
      const results = await aniListAPI.searchManga(randomTitle);
      if (results && results.length > 0) {
        const webtoon = results[0];
        recommendation = {
          title: webtoon.title.english || webtoon.title.romaji,
          author: 'Various',
          description: webtoon.description,
          cover: webtoon.coverImage.large,
          type: 'webtoon',
          totalChapters: webtoon.chapters,
        };
      }
    } else if (type === 'comic') {
      const data = await googleBooksAPI.searchBooks(randomTitle);
      if (data && data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        recommendation = {
          title: book.title,
          author: book.authors ? book.authors.join(', ') : 'Unknown',
          description: book.description,
          cover: book.imageLinks ? book.imageLinks.thumbnail : null,
          type: 'comic',
        };
      }
    } else if (type === 'lightnovel') {
      const results = await aniListAPI.searchLightNovel(randomTitle);
      if (results && results.length > 0) {
        const novel = results[0];
        recommendation = {
          title: novel.title.english || novel.title.romaji,
          author: 'Various',
          description: novel.description,
          cover: novel.coverImage.large,
          type: 'lightnovel',
          totalChapters: novel.chapters,
        };
      }
    }

    if (!recommendation) {
      return await interaction.editReply({
        embeds: [errorEmbed('No Recommendation', 'Could not find a recommendation right now. Please try again later.')],
      });
    }

    const embed = bookInfoEmbed(recommendation);
    embed.setTitle(`📚 Recommendation: ${recommendation.title}`);

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error getting recommendation:', error);
    await interaction.editReply({
      embeds: [errorEmbed('Error', 'Failed to get recommendation. Please try again.')],
    });
  }
}
