import { SlashCommandBuilder } from 'discord.js';
import User from '../../../database/models/User.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('remove')
  .setDescription('Remove a title from your reading list')
  .addStringOption(option =>
    option.setName('title')
      .setDescription('The title to remove')
      .setRequired(true));

export async function execute(interaction) {
  const title = interaction.options.getString('title');
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

    const removedItem = user.readingList.splice(itemIndex, 1)[0];
    await user.save();

    logger.info(`User ${interaction.user.username} removed "${title}" from their reading list`);

    await interaction.reply({
      embeds: [successEmbed('Removed from Reading List', `Successfully removed "${removedItem.title}" from your reading list!`)],
    });
  } catch (error) {
    logger.error('Error removing from reading list:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to remove title from reading list. Please try again.')],
      ephemeral: true,
    });
  }
}
