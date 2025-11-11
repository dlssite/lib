import { SlashCommandBuilder } from 'discord.js';
import { scheduleReminder } from '../../../utils/scheduler.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { getServerConfig } from '../../admin/config.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('remind')
  .setDescription('Set a reading reminder')
  .addStringOption(option =>
    option.setName('message')
      .setDescription('Reminder message')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('time')
      .setDescription('When to remind (e.g., "1h", "30m", "2d")')
      .setRequired(true));

export async function execute(interaction) {
  const message = interaction.options.getString('message');
  const timeString = interaction.options.getString('time');
  const userId = interaction.user.id;

  // Parse time string (simple implementation)
  const timeRegex = /^(\d+)([mhd])$/i;
  const match = timeString.match(timeRegex);

  if (!match) {
    return await interaction.reply({
      embeds: [errorEmbed('Invalid Time', 'Please use format like "1h" (1 hour), "30m" (30 minutes), or "2d" (2 days).')],
      ephemeral: true,
    });
  }

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  let cronExpression;
  const now = new Date();

  switch (unit) {
    case 'm':
      if (amount > 59) {
        return await interaction.reply({
          embeds: [errorEmbed('Invalid Time', 'Minutes must be 59 or less.')],
          ephemeral: true,
        });
      }
      now.setMinutes(now.getMinutes() + amount);
      cronExpression = `${now.getMinutes()} ${now.getHours()} ${now.getDate()} ${now.getMonth() + 1} *`;
      break;
    case 'h':
      if (amount > 23) {
        return await interaction.reply({
          embeds: [errorEmbed('Invalid Time', 'Hours must be 23 or less.')],
          ephemeral: true,
        });
      }
      now.setHours(now.getHours() + amount);
      cronExpression = `${now.getMinutes()} ${now.getHours()} ${now.getDate()} ${now.getMonth() + 1} *`;
      break;
    case 'd':
      if (amount > 30) {
        return await interaction.reply({
          embeds: [errorEmbed('Invalid Time', 'Days must be 30 or less.')],
          ephemeral: true,
        });
      }
      now.setDate(now.getDate() + amount);
      cronExpression = `${now.getMinutes()} ${now.getHours()} ${now.getDate()} ${now.getMonth() + 1} *`;
      break;
    default:
      return await interaction.reply({
        embeds: [errorEmbed('Invalid Time', 'Invalid time unit. Use m, h, or d.')],
        ephemeral: true,
      });
  }

  try {
    const taskId = `remind-${userId}-${Date.now()}`;
    const config = await getServerConfig(interaction.guildId);
    const channelId = config.reminder_channel_id;
    scheduleReminder(userId, message, cronExpression, interaction.client, channelId, taskId);

    await interaction.reply({
      embeds: [successEmbed('Reminder Set', `I'll remind you: "${message}" in ${amount}${unit}.`)],
    });
  } catch (error) {
    logger.error('Error setting reminder:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to set reminder. Please try again.')],
      ephemeral: true,
    });
  }
}
