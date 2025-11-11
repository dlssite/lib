import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { subscribeToReleases, unsubscribeFromReleases } from '../../../utils/scheduler.js';
import User from '../../../database/models/User.js';
import logger from '../../../utils/logger.js';

export const name = 'releases';
export const description = 'Subscribe to new chapter alerts';

export async function run(message, args) {
  const userId = message.author.id;
  const subcommand = args[0]?.toLowerCase();

  if (!subcommand || !['subscribe', 'unsubscribe', 'list'].includes(subcommand)) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage:\n`!releases subscribe <title>` - Subscribe to alerts\n`!releases unsubscribe <title>` - Unsubscribe from alerts\n`!releases list` - List your subscriptions')]
    });
  }

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return message.reply({
        embeds: [errorEmbed('No Profile', 'You need to have a reading profile first!')]
      });
    }

    if (subcommand === 'subscribe') {
      if (args.length < 2) {
        return message.reply({
          embeds: [errorEmbed('Invalid Usage', 'Usage: `!releases subscribe <title>`')]
        });
      }

      const title = args.slice(1).join(' ');

      // Check if title exists in user's list
      const item = user.readingList.find(item => item.title.toLowerCase() === title.toLowerCase());
      if (!item) {
        return message.reply({
          embeds: [errorEmbed('Title Not Found', `You must add "${title}" to your reading list first with \`!add\`.`)]
        });
      }

      // Check if already subscribed
      if (user.releaseSubscriptions && user.releaseSubscriptions.includes(title.toLowerCase())) {
        return message.reply({
          embeds: [errorEmbed('Already Subscribed', `You are already subscribed to "${title}" releases.`)]
        });
      }

      // Subscribe to releases
      subscribeToReleases(userId, title, message.channel.id);

      // Update user document
      if (!user.releaseSubscriptions) user.releaseSubscriptions = [];
      user.releaseSubscriptions.push(title.toLowerCase());
      await user.save();

      await message.reply({
        embeds: [successEmbed('Subscribed', `You'll now receive alerts for new "${title}" releases in this channel!`)]
      });

      logger.info(`User ${message.author.username} subscribed to "${title}" releases`);

    } else if (subcommand === 'unsubscribe') {
      if (args.length < 2) {
        return message.reply({
          embeds: [errorEmbed('Invalid Usage', 'Usage: `!releases unsubscribe <title>`')]
        });
      }

      const title = args.slice(1).join(' ');

      if (!user.releaseSubscriptions || !user.releaseSubscriptions.includes(title.toLowerCase())) {
        return message.reply({
          embeds: [errorEmbed('Not Subscribed', `You are not subscribed to "${title}" releases.`)]
        });
      }

      // Unsubscribe from releases
      unsubscribeFromReleases(userId, title);

      // Update user document
      user.releaseSubscriptions = user.releaseSubscriptions.filter(sub => sub !== title.toLowerCase());
      await user.save();

      await message.reply({
        embeds: [successEmbed('Unsubscribed', `You will no longer receive alerts for "${title}" releases.`)]
      });

      logger.info(`User ${message.author.username} unsubscribed from "${title}" releases`);

    } else if (subcommand === 'list') {
      if (!user.releaseSubscriptions || user.releaseSubscriptions.length === 0) {
        return message.reply({
          embeds: [errorEmbed('No Subscriptions', 'You are not subscribed to any release alerts.\nUse `!releases subscribe <title>` to subscribe.')]
        });
      }

      const subscriptions = user.releaseSubscriptions.map(title => {
        const item = user.readingList.find(item => item.title.toLowerCase() === title);
        return item ? `• ${item.title} (${item.type})` : `• ${title} (not in list)`;
      }).join('\n');

      await message.reply({
        embeds: [successEmbed('Your Release Subscriptions', subscriptions)]
      });

      logger.info(`User ${message.author.username} listed ${user.releaseSubscriptions.length} subscriptions`);
    }
  } catch (error) {
    logger.error('Error with releases command:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to process releases command. Please try again.')]
    });
  }
}
