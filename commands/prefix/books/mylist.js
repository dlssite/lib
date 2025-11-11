import { readingListEmbed, errorEmbed } from '../../../utils/embeds.js';
import { formatProgress } from '../../../utils/formatter.js';
import User from '../../../database/models/User.js';
import logger from '../../../utils/logger.js';

export const name = 'mylist';
export const description = 'View your reading list';

export async function run(message, args) {
  const userId = message.author.id;

  try {
    const user = await User.findOne({ userId });
    if (!user || user.readingList.length === 0) {
      return message.reply({
        embeds: [errorEmbed('Empty List', 'Your reading list is empty! Use `!add <title> <type>` to add titles.')]
      });
    }

    const formattedList = user.readingList.map((item, index) => {
      const progress = formatProgress(item.progress, item.type);
      return `${index + 1}. **${item.title}** (${item.type})\n   Status: ${item.status} | Progress: ${progress}`;
    }).join('\n\n');

    await message.reply({
      embeds: [readingListEmbed(message.author.username, formattedList, user.readingList.length)]
    });

    logger.info(`User ${message.author.username} viewed their reading list`);
  } catch (error) {
    logger.error('Error fetching reading list:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to fetch your reading list. Please try again.')]
    });
  }
}
