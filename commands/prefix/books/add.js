import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { getServerConfig } from '../../slash/admin/config.js';
import User from '../../../database/models/User.js';
import logger from '../../../utils/logger.js';

export const name = 'add';
export const description = 'Add a title to your reading list';

export async function run(message, args) {
  const userId = message.author.id;
  const guildId = message.guild.id;

  if (args.length < 2) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage: `!add <title> <type>`\nTypes: book, manga, webtoon, comic, lightnovel')]
    });
  }

  const title = args.slice(0, -1).join(' ');
  const type = args[args.length - 1].toLowerCase();

  const validTypes = ['book', 'manga', 'webtoon', 'comic', 'lightnovel'];
  if (!validTypes.includes(type)) {
    return message.reply({
      embeds: [errorEmbed('Invalid Type', `Valid types: ${validTypes.join(', ')}`)]
    });
  }

  try {
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, username: message.author.username });
    }

    // Check if title already exists
    const existingTitle = user.readingList.find(item => item.title.toLowerCase() === title.toLowerCase());
    if (existingTitle) {
      return message.reply({
        embeds: [errorEmbed('Already Added', 'This title is already in your reading list!')]
      });
    }

    // Check max list size
    const config = getServerConfig(guildId);
    if (user.readingList.length >= config.max_list_size) {
      return message.reply({
        embeds: [errorEmbed('List Full', `Your reading list is full! Max size: ${config.max_list_size}`)]
      });
    }

    user.readingList.push({
      title,
      type,
      status: 'reading',
      progress: 0,
      addedAt: new Date()
    });

    await user.save();

    await message.reply({
      embeds: [successEmbed('Added to List', `Added "${title}" (${type}) to your reading list!`)]
    });

    logger.info(`User ${message.author.username} added "${title}" to their reading list`);
  } catch (error) {
    logger.error('Error adding to reading list:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to add title to your reading list. Please try again.')]
    });
  }
}
