import { SlashCommandBuilder } from 'discord.js';
import User from '../../../database/models/User.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('add')
  .setDescription('Add a title to your reading list')
  .addStringOption(option =>
    option.setName('title')
      .setDescription('The title to add')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('type')
      .setDescription('Type of media')
      .setRequired(true)
      .addChoices(
        { name: 'Book', value: 'book' },
        { name: 'Manga', value: 'manga' },
        { name: 'Webtoon', value: 'webtoon' },
        { name: 'Comic', value: 'comic' },
        { name: 'Light Novel', value: 'lightnovel' }
      ));

export async function execute(interaction) {
  const title = interaction.options.getString('title');
  const type = interaction.options.getString('type');
  const userId = interaction.user.id;
  const username = interaction.user.username;

  try {
    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({
        userId,
        username,
        readingList: [],
      });
    }

    // Check if title already exists in reading list
    const existingItem = user.readingList.find(item =>
      item.title.toLowerCase() === title.toLowerCase() && item.type === type
    );

    if (existingItem) {
      return await interaction.reply({
        embeds: [errorEmbed('Already Added', 'This title is already in your reading list!')],
        ephemeral: true,
      });
    }

    // Add to reading list
    user.readingList.push({
      title,
      type,
      status: 'reading',
      progress: 0,
      addedAt: new Date(),
    });

    await user.save();

    logger.info(`User ${username} added "${title}" (${type}) to their reading list`);

    await interaction.reply({
      embeds: [successEmbed('Added to Reading List', `Successfully added "${title}" to your reading list!`)],
    });
  } catch (error) {
    logger.error('Error adding to reading list:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to add title to reading list. Please try again.')],
      ephemeral: true,
    });
  }
}
