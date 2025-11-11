import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { scheduleReminder } from '../../../utils/scheduler.js';
import { getServerConfig } from '../../../slash/admin/config.js';
import User from '../../../database/models/User.js';
import logger from '../../../utils/logger.js';

export const name = 'remind';
export const description = 'Set a reading reminder';

export async function run(message, args) {
  const userId = message.author.id;

  if (args.length < 2) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage: `!remind <message> <time>`\nExample: `!remind "Finish chapter 5" "2 hours"` or `!remind "Read daily" "tomorrow 8pm"`')]
    });
  }

  const reminderMessage = args.slice(0, -1).join(' ');
  const timeStr = args[args.length - 1];

  try {
    // Parse time (simple implementation - can be enhanced)
    let delay;
    const timeRegex = /(\d+)\s*(hour|minute|day|week)s?/i;
    const match = timeStr.match(timeRegex);

    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2].toLowerCase();

      switch (unit) {
        case 'minute':
          delay = amount * 60 * 1000;
          break;
        case 'hour':
          delay = amount * 60 * 60 * 1000;
          break;
        case 'day':
          delay = amount * 24 * 60 * 60 * 1000;
          break;
        case 'week':
          delay = amount * 7 * 24 * 60 * 60 * 1000;
          break;
        default:
          delay = 60 * 60 * 1000; // default 1 hour
      }
    } else {
      // Try to parse "tomorrow 8pm" format
      const tomorrowRegex = /tomorrow\s+(\d+)(am|pm)/i;
      const tomorrowMatch = timeStr.match(tomorrowRegex);

      if (tomorrowMatch) {
        const hour = parseInt(tomorrowMatch[1]);
        const ampm = tomorrowMatch[2].toLowerCase();
        const targetHour = ampm === 'pm' && hour !== 12 ? hour + 12 : hour === 12 && ampm === 'am' ? 0 : hour;

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        tomorrow.setHours(targetHour, 0, 0, 0);

        delay = tomorrow.getTime() - now.getTime();
      } else {
        return message.reply({
          embeds: [errorEmbed('Invalid Time', 'Please specify time like "2 hours", "30 minutes", "tomorrow 8pm", etc.')]
        });
      }
    }

    if (delay < 60000) { // minimum 1 minute
      return message.reply({
        embeds: [errorEmbed('Invalid Time', 'Reminder must be at least 1 minute in the future.')]
      });
    }

    if (delay > 30 * 24 * 60 * 60 * 1000) { // maximum 30 days
      return message.reply({
        embeds: [errorEmbed('Invalid Time', 'Reminder cannot be more than 30 days in the future.')]
      });
    }

    // Schedule the reminder
    const config = await getServerConfig(message.guild.id);
    const channelId = config.reminder_channel_id;
    scheduleReminder(userId, reminderMessage, delay, message.client, channelId);

    const timeFormatted = delay < 60 * 60 * 1000 ?
      `${Math.round(delay / (60 * 1000))} minutes` :
      delay < 24 * 60 * 60 * 1000 ?
      `${Math.round(delay / (60 * 60 * 1000))} hours` :
      `${Math.round(delay / (24 * 60 * 60 * 1000))} days`;

    await message.reply({
      embeds: [successEmbed('Reminder Set', `I'll remind you: "${reminderMessage}"\n\n⏰ In ${timeFormatted}`)]
    });

    logger.info(`User ${message.author.username} set a reminder for ${timeFormatted}`);
  } catch (error) {
    logger.error('Error setting reminder:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to set reminder. Please try again.')]
    });
  }
}
