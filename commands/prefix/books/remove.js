import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import User from '../../../database/models/User.js';
import logger from '../../../utils/logger.js';

export const name = 'remove';
export const description = 'Remove a title from your reading list';

export async function run(message, args) {
  const userId = message.author.id;

  if (args.length === 0) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage: `!remove <title>`')]
    });
  }

  const title = args.join(' ');

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return message.reply({
        embeds: [errorEmbed('No List Found', 'You don\'t have a reading list yet!')]
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

    const removedItem = user.readingList.splice(itemIndex, 1)[0];
    await user.save();

    await message.reply({
      embeds: [successEmbed('Removed from List', `Removed "${removedItem.title}" from your reading list!`)]
    });

    logger.info(`User ${message.author.username} removed "${removedItem.title}" from their reading list`);
  } catch (error) {
    logger.error('Error removing from reading list:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to remove title from your reading list. Please try again.')]
    });
  }
}
