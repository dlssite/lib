import { SlashCommandBuilder } from 'discord.js';
import Group from '../../../database/models/Group.js';
import { groupListEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('listgroups')
  .setDescription('List all available reading groups');

export async function execute(interaction) {
  try {
    const groups = await Group.find({}).limit(20);

    if (groups.length === 0) {
      return await interaction.reply({
        embeds: [errorEmbed('No Groups', 'No reading groups have been created yet! Use `/creategroup` to create one.')],
        ephemeral: true,
      });
    }

    const formattedGroups = groups.map(group =>
      `**${group.name}**\nGenre: ${group.genre || 'General'} | Type: ${group.type} | Members: ${group.members.length}`
    ).join('\n\n');

    const embed = groupListEmbed(formattedGroups, groups.length);

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error listing groups:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to fetch groups. Please try again.')],
      ephemeral: true,
    });
  }
}
