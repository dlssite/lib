import { SlashCommandBuilder } from 'discord.js';
import User from '../../../database/models/User.js';
import { readingListEmbed, errorEmbed } from '../../../utils/embeds.js';
import { formatProgress } from '../../../utils/formatter.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('mylist')
  .setDescription('View your reading list');

export async function execute(interaction) {
  const userId = interaction.user.id;

  try {
    const user = await User.findOne({ userId });

    if (!user || user.readingList.length === 0) {
      return await interaction.reply({
        embeds: [errorEmbed('No Reading List', 'You haven\'t added any titles to your reading list yet! Use `/add` to get started.')],
        ephemeral: true,
      });
    }

    const formattedList = user.readingList.map((item, index) => {
      const progress = formatProgress(item.progress, item.type);
      return `${index + 1}. **${item.title}** (${item.type})\n   Status: ${item.status} | Progress: ${progress}`;
    }).join('\n\n');

    const embed = readingListEmbed(interaction.user.username, formattedList, user.readingList.length);

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error fetching reading list:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to fetch your reading list. Please try again.')],
      ephemeral: true,
    });
  }
}
