import { SlashCommandBuilder } from 'discord.js';
import User from '../../../database/models/User.js';
import { leaderboardEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('View top readers based on XP');

export async function execute(interaction) {
  try {
    const users = await User.find({})
      .sort({ xp: -1 })
      .limit(10)
      .select('username xp badges');

    if (users.length === 0) {
      return await interaction.reply({
        embeds: [errorEmbed('No Users', 'No users have earned XP yet!')],
        ephemeral: true,
      });
    }

    const embed = leaderboardEmbed(users, users.length);
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to fetch leaderboard. Please try again.')],
      ephemeral: true,
    });
  }
}
