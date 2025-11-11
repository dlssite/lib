import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { formatProgress } from '../../../utils/formatter.js';
import User from '../../../database/models/User.js';
import logger from '../../../utils/logger.js';

export const name = 'progress';
export const description = 'Update reading progress';

export async function run(message, args) {
  const userId = message.author.id;

  if (args.length < 2) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage: `!progress <title> <progress>`\nExample: `!progress "Solo Leveling" 50%` or `!progress "One Piece" 1000`')]
    });
  }

  const title = args.slice(0, -1).join(' ');
  const progressStr = args[args.length - 1];

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return message.reply({
        embeds: [errorEmbed('No List Found', 'You don\'t have a reading list yet! Use `!add <title> <type>` to add titles.')]
      });
    }

    const itemIndex = user.readingList.findIndex(item =>
      item.title.toLowerCase() === title.toLowerCase()
    );

    if (itemIndex === -1) {
      return message.reply({
        embeds: [errorEmbed('Title Not Found', `Could not find "${title}" in your reading list.`)]
      });
    }

    const item = user.readingList[itemIndex];
    let progress;

    if (progressStr.endsWith('%')) {
      progress = parseFloat(progressStr.slice(0, -1));
      if (isNaN(progress) || progress < 0 || progress > 100) {
        return message.reply({
          embeds: [errorEmbed('Invalid Progress', 'Progress percentage must be between 0% and 100%.')]
        });
      }
    } else {
      progress = parseInt(progressStr);
      if (isNaN(progress) || progress < 0) {
        return message.reply({
          embeds: [errorEmbed('Invalid Progress', 'Progress must be a positive number.')]
        });
      }
    }

    user.readingList[itemIndex].progress = progress;

    // Auto-complete if 100%
    if (progressStr.endsWith('%') && progress === 100) {
      user.readingList[itemIndex].status = 'completed';
      user.xp += 10; // XP for completing a title
    }

    await user.save();

    const formattedProgress = formatProgress(progress, item.type);
    await message.reply({
      embeds: [successEmbed('Progress Updated', `Updated "${item.title}" progress to ${formattedProgress}!`)]
    });

    logger.info(`User ${message.author.username} updated progress for "${item.title}" to ${formattedProgress}`);
  } catch (error) {
    logger.error('Error updating progress:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to update progress. Please try again.')]
    });
  }
}
