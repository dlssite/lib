import { SlashCommandBuilder } from 'discord.js';
import Group from '../../../database/models/Group.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('creategroup')
  .setDescription('Create a reading group')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('Name of the group')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('genre')
      .setDescription('Genre of the group (optional)')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('type')
      .setDescription('Type of media')
      .addChoices(
        { name: 'Book', value: 'book' },
        { name: 'Manga', value: 'manga' },
        { name: 'Webtoon', value: 'webtoon' },
        { name: 'Comic', value: 'comic' },
        { name: 'Light Novel', value: 'lightnovel' },
        { name: 'Mixed', value: 'mixed' }
      ));

export async function execute(interaction) {
  const name = interaction.options.getString('name');
  const genre = interaction.options.getString('genre');
  const type = interaction.options.getString('type') || 'mixed';
  const userId = interaction.user.id;

  try {
    // Check if group name already exists
    const existingGroup = await Group.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingGroup) {
      return await interaction.reply({
        embeds: [errorEmbed('Group Exists', 'A group with this name already exists!')],
        ephemeral: true,
      });
    }

    const group = new Group({
      name,
      genre,
      type,
      members: [userId],
      createdBy: userId,
    });

    await group.save();

    logger.info(`User ${interaction.user.username} created group "${name}"`);

    await interaction.reply({
      embeds: [successEmbed('Group Created', `Successfully created reading group "${name}"! Others can now join using \`/join name:"${name}"\`.`)]
    });
  } catch (error) {
    logger.error('Error creating group:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to create group. Please try again.')],
      ephemeral: true,
    });
  }
}
