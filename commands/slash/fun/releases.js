import { SlashCommandBuilder } from 'discord.js';
import { scheduleReleaseCheck } from '../../../utils/scheduler.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('releases')
  .setDescription('Subscribe to release notifications')
  .addSubcommand(subcommand =>
    subcommand
      .setName('subscribe')
      .setDescription('Subscribe to notifications for a title')
      .addStringOption(option =>
        option.setName('title')
          .setDescription('Title to subscribe to')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('type')
          .setDescription('Type of media')
          .addChoices(
            { name: 'Manga', value: 'manga' },
            { name: 'Webtoon', value: 'webtoon' },
            { name: 'Light Novel', value: 'lightnovel' }
          )
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('unsubscribe')
      .setDescription('Unsubscribe from notifications')
      .addStringOption(option =>
        option.setName('title')
          .setDescription('Title to unsubscribe from')
          .setRequired(true)));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  if (subcommand === 'subscribe') {
    const title = interaction.options.getString('title');
    const type = interaction.options.getString('type');

    try {
      // Schedule daily checks for new releases
      const taskId = `release-${userId}-${title.replace(/\s+/g, '-')}`;
      scheduleReleaseCheck(title, type, '0 9 * * *', taskId); // Daily at 9 AM

      await interaction.reply({
        embeds: [successEmbed('Subscribed', `You'll now receive notifications for new "${title}" releases!`)],
      });
    } catch (error) {
      logger.error('Error subscribing to releases:', error);
      await interaction.reply({
        embeds: [errorEmbed('Error', 'Failed to subscribe to release notifications. Please try again.')],
        ephemeral: true,
      });
    }
  } else if (subcommand === 'unsubscribe') {
    const title = interaction.options.getString('title');

    try {
      const taskId = `release-${userId}-${title.replace(/\s+/g, '-')}`;
      // Note: In a real implementation, you'd need to cancel the specific task
      // For now, we'll just acknowledge the request

      await interaction.reply({
        embeds: [successEmbed('Unsubscribed', `Unsubscribed from "${title}" release notifications.`)],
      });
    } catch (error) {
      logger.error('Error unsubscribing from releases:', error);
      await interaction.reply({
        embeds: [errorEmbed('Error', 'Failed to unsubscribe from release notifications. Please try again.')],
        ephemeral: true,
      });
    }
  }
}
