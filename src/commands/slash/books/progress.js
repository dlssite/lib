import { SlashCommandBuilder } from 'discord.js';
import User from '../../../database/models/User.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('progress')
  .setDescription('Update reading progress')
  .addStringOption(option =>
    option.setName('title')
      .setDescription('The title to update')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('progress')
      .setDescription('Progress percentage (0-100)')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(100))
  .addIntegerOption(option =>
    option.setName('chapters')
      .setDescription('Current chapter number (optional)')
      .setMinValue(1));

export async function execute(interaction) {
  const title = interaction.options.getString('title');
  const progress = interaction.options.getInteger('progress');
  const chapters = interaction.options.getInteger('chapters');
  const userId = interaction.user.id;

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      return await interaction.reply({
        embeds: [errorEmbed('No Reading List', 'You haven\'t added any titles to your reading list yet!')],
        ephemeral: true,
      });
    }

    const itemIndex = user.readingList.findIndex(item =>
      item.title.toLowerCase() === title.toLowerCase()
    );

    if (itemIndex === -1) {
      return await interaction.reply({
        embeds: [errorEmbed('Not Found', 'This title is not in your reading list!')],
        ephemeral: true,
      });
    }

    // Update progress
    user.readingList[itemIndex].progress = progress;
    if (chapters) {
      user.readingList[itemIndex].chapters = chapters;
    }

    // Check if completed
    if (progress === 100) {
      user.readingList[itemIndex].status = 'completed';
      user.xp += 10; // Award XP for completion
    }

    await user.save();

    logger.info(`User ${interaction.user.username} updated progress for "${title}": ${progress}%`);

    await interaction.reply({
      embeds: [successEmbed('Progress Updated', `Updated progress for "${title}" to ${progress}%!${progress === 100 ? ' 🎉 Congratulations on completing it!' : ''}`)],
    });
  } catch (error) {
    logger.error('Error updating progress:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to update progress. Please try again.')],
      ephemeral: true,
    });
  }
}
