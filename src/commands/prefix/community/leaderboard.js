import { leaderboardEmbed, errorEmbed } from '../../../utils/embeds.js';
import User from '../../../database/models/User.js';
import logger from '../../../utils/logger.js';

export const name = 'leaderboard';
export const description = 'View top readers based on XP';

export async function run(message, args) {
  try {
    const topUsers = await User.find({})
      .sort({ xp: -1 })
      .limit(10)
      .select('username xp badges');

    if (topUsers.length === 0) {
      return message.reply({
        embeds: [errorEmbed('No Data', 'No users found with XP data yet!')]
      });
    }

    const embed = leaderboardEmbed(topUsers);
    await message.reply({ embeds: [embed] });

    logger.info(`User ${message.author.username} viewed the leaderboard`);
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to fetch leaderboard. Please try again.')]
    });
  }
}
