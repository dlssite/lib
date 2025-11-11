import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('roles')
  .setDescription('Manage reading-related roles')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new reading role')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Role name')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('color')
          .setDescription('Role color (hex code)')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('assign')
      .setDescription('Assign a role to a user')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to assign role to')
          .setRequired(true))
      .addRoleOption(option =>
        option.setName('role')
          .setDescription('Role to assign')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Remove a role from a user')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to remove role from')
          .setRequired(true))
      .addRoleOption(option =>
        option.setName('role')
          .setDescription('Role to remove')
          .setRequired(true)));

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
      embeds: [errorEmbed('Permission Denied', 'You need Administrator permissions to use this command.')],
      ephemeral: true,
    });
  }

  const subcommand = interaction.options.getSubcommand();

  try {
    if (subcommand === 'create') {
      const name = interaction.options.getString('name');
      const color = interaction.options.getString('color') || '#0099ff';

      // Validate color format
      if (!/^#[0-9A-F]{6}$/i.test(color)) {
        return await interaction.reply({
          embeds: [errorEmbed('Invalid Color', 'Please provide a valid hex color code (e.g., #ff0000).')],
          ephemeral: true,
        });
      }

      const existingRole = interaction.guild.roles.cache.find(role => role.name === name);
      if (existingRole) {
        return await interaction.reply({
          embeds: [errorEmbed('Role Exists', 'A role with this name already exists!')],
          ephemeral: true,
        });
      }

      const role = await interaction.guild.roles.create({
        name,
        color,
        reason: `Created by ${interaction.user.username} via Arcanum bot`,
      });

      await interaction.reply({
        embeds: [successEmbed('Role Created', `Successfully created role "${role.name}" with color ${color}!`)],
      });

    } else if (subcommand === 'assign') {
      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');

      const member = await interaction.guild.members.fetch(user.id);
      await member.roles.add(role);

      await interaction.reply({
        embeds: [successEmbed('Role Assigned', `Successfully assigned "${role.name}" to ${user.username}!`)],
      });

    } else if (subcommand === 'remove') {
      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');

      const member = await interaction.guild.members.fetch(user.id);
      await member.roles.remove(role);

      await interaction.reply({
        embeds: [successEmbed('Role Removed', `Successfully removed "${role.name}" from ${user.username}!`)],
      });
    }

    logger.info(`Admin command 'roles' used by ${interaction.user.username} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error managing roles:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to manage roles. Please check bot permissions and try again.')],
      ephemeral: true,
    });
  }
}
