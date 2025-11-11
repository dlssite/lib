import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const name = 'roles';
export const description = 'Manage reading-related roles';

export async function run(message, args) {
  if (!message.member.permissions.has('MANAGE_ROLES')) {
    return message.reply({
      embeds: [errorEmbed('Permission Denied', 'You need the "Manage Roles" permission to manage reading roles.')]
    });
  }

  const subcommand = args[0]?.toLowerCase();

  if (!subcommand || !['create', 'assign', 'remove', 'list'].includes(subcommand)) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage:\n`!roles create <name>` - Create a reading role\n`!roles assign <@user> <role>` - Assign role to user\n`!roles remove <@user> <role>` - Remove role from user\n`!roles list` - List reading roles')]
    });
  }

  try {
    if (subcommand === 'create') {
      if (args.length < 2) {
        return message.reply({
          embeds: [errorEmbed('Invalid Usage', 'Usage: `!roles create <role_name>`')]
        });
      }

      const roleName = args.slice(1).join(' ');

      // Check if role already exists
      const existingRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === roleName.toLowerCase());
      if (existingRole) {
        return message.reply({
          embeds: [errorEmbed('Role Exists', `A role named "${roleName}" already exists!`)]
        });
      }

      // Create the role
      const role = await message.guild.roles.create({
        name: roleName,
        color: '#0099ff',
        reason: 'Created by Arcanum bot for reading community'
      });

      await message.reply({
        embeds: [successEmbed('Role Created', `Created reading role "${roleName}"!\n\nRole: ${role}`)]
      });

      logger.info(`User ${message.author.username} created role "${roleName}" in ${message.guild.name}`);

    } else if (subcommand === 'assign') {
      if (args.length < 3) {
        return message.reply({
          embeds: [errorEmbed('Invalid Usage', 'Usage: `!roles assign <@user> <role_name>`')]
        });
      }

      const userMention = args[1];
      const roleName = args.slice(2).join(' ');

      // Parse user mention
      const userId = userMention.replace(/[<@!>]/g, '');
      const member = await message.guild.members.fetch(userId).catch(() => null);

      if (!member) {
        return message.reply({
          embeds: [errorEmbed('User Not Found', 'Could not find the specified user.')]
        });
      }

      // Find the role
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      if (!role) {
        return message.reply({
          embeds: [errorEmbed('Role Not Found', `Could not find role "${roleName}".`)]
        });
      }

      // Check bot permissions
      if (!message.guild.members.me.permissions.has('MANAGE_ROLES')) {
        return message.reply({
          embeds: [errorEmbed('Bot Permission Denied', 'I don\'t have permission to manage roles.')]
        });
      }

      // Check role hierarchy
      if (role.position >= message.guild.members.me.roles.highest.position) {
        return message.reply({
          embeds: [errorEmbed('Role Hierarchy', 'I cannot assign a role that is higher than or equal to my highest role.')]
        });
      }

      // Assign the role
      await member.roles.add(role);

      await message.reply({
        embeds: [successEmbed('Role Assigned', `Assigned "${role.name}" role to ${member.user.username}!`)]
      });

      logger.info(`User ${message.author.username} assigned role "${role.name}" to ${member.user.username}`);

    } else if (subcommand === 'remove') {
      if (args.length < 3) {
        return message.reply({
          embeds: [errorEmbed('Invalid Usage', 'Usage: `!roles remove <@user> <role_name>`')]
        });
      }

      const userMention = args[1];
      const roleName = args.slice(2).join(' ');

      // Parse user mention
      const userId = userMention.replace(/[<@!>]/g, '');
      const member = await message.guild.members.fetch(userId).catch(() => null);

      if (!member) {
        return message.reply({
          embeds: [errorEmbed('User Not Found', 'Could not find the specified user.')]
        });
      }

      // Find the role
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      if (!role) {
        return message.reply({
          embeds: [errorEmbed('Role Not Found', `Could not find role "${roleName}".`)]
        });
      }

      // Check if user has the role
      if (!member.roles.cache.has(role.id)) {
        return message.reply({
          embeds: [errorEmbed('Role Not Assigned', `${member.user.username} does not have the "${role.name}" role.`)]
        });
      }

      // Check bot permissions
      if (!message.guild.members.me.permissions.has('MANAGE_ROLES')) {
        return message.reply({
          embeds: [errorEmbed('Bot Permission Denied', 'I don\'t have permission to manage roles.')]
        });
      }

      // Check role hierarchy
      if (role.position >= message.guild.members.me.roles.highest.position) {
        return message.reply({
          embeds: [errorEmbed('Role Hierarchy', 'I cannot remove a role that is higher than or equal to my highest role.')]
        });
      }

      // Remove the role
      await member.roles.remove(role);

      await message.reply({
        embeds: [successEmbed('Role Removed', `Removed "${role.name}" role from ${member.user.username}!`)]
      });

      logger.info(`User ${message.author.username} removed role "${role.name}" from ${member.user.username}`);

    } else if (subcommand === 'list') {
      const readingRoles = message.guild.roles.cache.filter(role =>
        role.name.toLowerCase().includes('read') ||
        role.name.toLowerCase().includes('book') ||
        role.name.toLowerCase().includes('manga') ||
        role.name.toLowerCase().includes('comic')
      );

      if (readingRoles.size === 0) {
        return message.reply({
          embeds: [errorEmbed('No Reading Roles', 'No reading-related roles found in this server.\nUse `!roles create <name>` to create one.')]
        });
      }

      const roleList = readingRoles.map(role => `• ${role.name} (${role.members.size} members)`).join('\n');

      await message.reply({
        embeds: [successEmbed('Reading Roles', roleList)]
      });

      logger.info(`User ${message.author.username} listed ${readingRoles.size} reading roles`);
    }
  } catch (error) {
    logger.error('Error with roles command:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to process roles command. Please try again.')]
    });
  }
}
