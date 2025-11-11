import { SlashCommandBuilder } from 'discord.js';
import Group from '../../../database/models/Group.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('join')
  .setDescription('Join a reading group')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('Name of the group to join')
      .setRequired(true));

export async function execute(interaction) {
  const groupName = interaction.options.getString('name');
  const userId = interaction.user.id;

  try {
    const group = await Group.findOne({ name: { $regex: new RegExp(`^${groupName}$`, 'i') } });

    if (!group) {
      return await interaction.reply({
        embeds: [errorEmbed('Group Not Found', `Could not find a group named "${groupName}". Use \`/listgroups\` to see available groups.`)],
        ephemeral: true,
      });
    }

    if (group.members.includes(userId)) {
      return await interaction.reply({
        embeds: [errorEmbed('Already Member', 'You are already a member of this group!')],
        ephemeral: true,
      });
    }

    group.members.push(userId);
    await group.save();

    logger.info(`User ${interaction.user.username} joined group "${groupName}"`);

    await interaction.reply({
      embeds: [successEmbed('Joined Group', `Successfully joined "${group.name}"! Welcome to the group!`)],
    });
  } catch (error) {
    logger.error('Error joining group:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to join group. Please try again.')],
      ephemeral: true,
    });
  }
}
