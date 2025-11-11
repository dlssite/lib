import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import User from '../../../database/models/User.js';
import logger from '../../../utils/logger.js';

export const name = 'schedule';
export const description = 'Create a reading schedule';

export async function run(message, args) {
  const userId = message.author.id;

  if (args.length < 3) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage: `!schedule <title> <chapters> <weeks>`\nExample: `!schedule "One Piece" 100 10` (100 chapters over 10 weeks)')]
    });
  }

  const title = args[0];
  const chapters = parseInt(args[1]);
  const weeks = parseInt(args[2]);

  if (isNaN(chapters) || chapters <= 0 || isNaN(weeks) || weeks <= 0) {
    return message.reply({
      embeds: [errorEmbed('Invalid Input', 'Chapters and weeks must be positive numbers.')]
    });
  }

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return message.reply({
        embeds: [errorEmbed('No List Found', 'You don\'t have a reading list yet!')]
      });
    }

    const item = user.readingList.find(item => item.title.toLowerCase() === title.toLowerCase());
    if (!item) {
      return message.reply({
        embeds: [errorEmbed('Title Not Found', `Could not find "${title}" in your reading list.`)]
      });
    }

    const chaptersPerWeek = Math.ceil(chapters / weeks);
    const schedule = [];

    for (let week = 1; week <= weeks; week++) {
      const startChapter = (week - 1) * chaptersPerWeek + 1;
      const endChapter = Math.min(week * chaptersPerWeek, chapters);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (week * 7));

      schedule.push({
        week,
        chapters: `${startChapter}-${endChapter}`,
        dueDate: dueDate.toDateString()
      });
    }

    const scheduleText = schedule.map(s => `Week ${s.week}: Chapters ${s.chapters} (Due: ${s.dueDate})`).join('\n');

    await message.reply({
      embeds: [successEmbed('Reading Schedule Created', `**${title}** - ${chapters} chapters over ${weeks} weeks\n\n${scheduleText}\n\n*Use \`!progress\` to update your progress!*`)]
    });

    logger.info(`User ${message.author.username} created a schedule for "${title}"`);
  } catch (error) {
    logger.error('Error creating schedule:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to create reading schedule. Please try again.')]
    });
  }
}
