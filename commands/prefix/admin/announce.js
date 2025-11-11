import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const name = 'announce';
export const description = 'Send an announcement to a channel';

export async function run(message, args) {
  if (!message.member.permissions.has('MANAGE_MESSAGES')) {
    return message.reply({
      embeds: [errorEmbed('Permission Denied', 'You need the "Manage Messages" permission to send announcements.')]
    });
  }

  if (args.length === 0) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage: `!announce <message>` or `!announce #channel <message>`')]
    });
  }

  try {
    let targetChannel = message.channel;
    let announcementMessage;

    // Check if first arg is a channel mention
    if (args[0].startsWith('<#') && args[0].endsWith('>')) {
      const channelId = args[0].slice(2, -1);
      const channel = message.guild.channels.cache.get(channelId);

      if (!channel) {
        return message.reply({
          embeds: [errorEmbed('Invalid Channel', 'Could not find the specified channel.')]
        });
      }

      if (!channel.permissionsFor(message.guild.members.me).has('SEND_MESSAGES')) {
        return message.reply({
          embeds: [errorEmbed('Permission Denied', 'I don\'t have permission to send messages in that channel.')]
        });
      }

      targetChannel = channel;
      announcementMessage = args.slice(1).join(' ');
    } else {
      announcementMessage = args.join(' ');
    }

    if (!announcementMessage.trim()) {
      return message.reply({
        embeds: [errorEmbed('Empty Message', 'Announcement message cannot be empty.')]
      });
    }

    // Send the announcement
    await targetChannel.send({
      embeds: [successEmbed('📢 Announcement', announcementMessage)]
    });

    // Confirm to the user
    if (targetChannel.id !== message.channel.id) {
      await message.reply({
        embeds: [successEmbed('Announcement Sent', `Announcement sent to ${targetChannel}!`)]
      });
    }

    logger.info(`User ${message.author.username} sent an announcement to #${targetChannel.name}`);
  } catch (error) {
    logger.error('Error sending announcement:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to send announcement. Please try again.')]
    });
  }
}
