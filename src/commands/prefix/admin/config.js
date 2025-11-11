import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { getServerConfig, setServerConfig } from '../../../slash/admin/config.js';
import logger from '../../../utils/logger.js';

export const name = 'config';
export const description = 'Configure bot settings for this server';

export async function run(message, args) {
  if (!message.member.permissions.has('ADMINISTRATOR')) {
    return message.reply({
      embeds: [errorEmbed('Permission Denied', 'You need Administrator permissions to configure the bot.')]
    });
  }

  const guildId = message.guild.id;

  if (args.length === 0) {
    // Show current config
    const config = getServerConfig(guildId);
    const configText = `
**Current Configuration:**

• **Prefix:** \`${config.prefix}\`
• **Embed Color:** ${config.embed_color}
• **XP Rate:** ${config.xp_rate}
• **Max Reading List Size:** ${config.max_list_size} titles
• **Bot Owner Role:** ${config.bot_owner_role ? `<@&${config.bot_owner_role}>` : 'Not set'}
• **User Access Role:** ${config.user_access_role ? `<@&${config.user_access_role}>` : 'Not set (everyone can use)'}
• **AI API Key:** ${config.ai_api_key ? 'Set (hidden)' : 'Not set'}
• **Patron Role:** ${config.patron_role_id ? `<@&${config.patron_role_id}>` : 'Not set'}
• **Queen Role:** ${config.queen_role_id ? `<@&${config.queen_role_id}>` : 'Not set'}
• **Reminder Channel:** ${config.reminder_channel_id ? `<#${config.reminder_channel_id}>` : 'Not set (DM only)'}

**Usage:** \`!config <setting> <value>\`
Available settings: prefix, embed_color, xp_rate, max_list_size, bot_owner_role, user_access_role, ai_api_key, patron_role_id, queen_role_id, reminder_channel_id
    `.trim();

    return message.reply({
      embeds: [successEmbed('Bot Configuration', configText)]
    });
  }

  const setting = args[0].toLowerCase();
  const value = args.slice(1).join(' ');

  if (!value) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage: `!config <setting> <value>`')]
    });
  }

  try {
    const config = getServerConfig(guildId);
    let updateMessage = '';

    switch (setting) {
      case 'prefix':
        if (value.length > 5) {
          return message.reply({
            embeds: [errorEmbed('Invalid Prefix', 'Prefix must be 5 characters or less.')]
          });
        }
        config.prefix = value;
        updateMessage = `Prefix updated to \`${value}\``;
        break;

      case 'embed_color':
        if (!/^#[0-9A-F]{6}$/i.test(value)) {
          return message.reply({
            embeds: [errorEmbed('Invalid Color', 'Embed color must be a valid hex color (e.g., #0099ff).')]
          });
        }
        config.embed_color = value;
        updateMessage = `Embed color updated to ${value}`;
        break;

      case 'xp_rate':
        const xpRate = parseFloat(value);
        if (isNaN(xpRate) || xpRate < 0.1 || xpRate > 5) {
          return message.reply({
            embeds: [errorEmbed('Invalid Value', 'XP rate must be between 0.1 and 5.')]
          });
        }
        config.xp_rate = xpRate;
        updateMessage = `XP rate updated to ${xpRate}`;
        break;

      case 'max_list_size':
        const maxListSize = parseInt(value);
        if (isNaN(maxListSize) || maxListSize < 10 || maxListSize > 200) {
          return message.reply({
            embeds: [errorEmbed('Invalid Value', 'Max list size must be between 10 and 200.')]
          });
        }
        config.max_list_size = maxListSize;
        updateMessage = `Max list size updated to ${maxListSize}`;
        break;

      case 'bot_owner_role':
        if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
          config.bot_owner_role = null;
          updateMessage = 'Bot owner role removed';
        } else {
          const roleId = value.replace(/[<@&>]/g, '');
          const role = message.guild.roles.cache.get(roleId);
          if (!role) {
            return message.reply({
              embeds: [errorEmbed('Invalid Role', 'Could not find the specified role.')]
            });
          }
          config.bot_owner_role = roleId;
          updateMessage = `Bot owner role set to ${role}`;
        }
        break;

      case 'user_access_role':
        if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
          config.user_access_role = null;
          updateMessage = 'User access role removed';
        } else {
          const roleId = value.replace(/[<@&>]/g, '');
          const role = message.guild.roles.cache.get(roleId);
          if (!role) {
            return message.reply({
              embeds: [errorEmbed('Invalid Role', 'Could not find the specified role.')]
            });
          }
          config.user_access_role = roleId;
          updateMessage = `User access role set to ${role}`;
        }
        break;

      case 'ai_api_key':
        if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
          config.ai_api_key = null;
          updateMessage = 'AI API key removed';
        } else {
          if (value.length < 10) {
            return message.reply({
              embeds: [errorEmbed('Invalid API Key', 'API key must be at least 10 characters long.')]
            });
          }
          config.ai_api_key = value;
          updateMessage = 'AI API key updated';
        }
        break;

      case 'patron_role_id':
        if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
          config.patron_role_id = null;
          updateMessage = 'Patron role removed';
        } else {
          const roleId = value.replace(/[<@&>]/g, '');
          const role = message.guild.roles.cache.get(roleId);
          if (!role) {
            return message.reply({
              embeds: [errorEmbed('Invalid Role', 'Could not find the specified role.')]
            });
          }
          config.patron_role_id = roleId;
          updateMessage = `Patron role set to ${role}`;
        }
        break;

      case 'queen_role_id':
        if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
          config.queen_role_id = null;
          updateMessage = 'Queen role removed';
        } else {
          const roleId = value.replace(/[<@&>]/g, '');
          const role = message.guild.roles.cache.get(roleId);
          if (!role) {
            return message.reply({
              embeds: [errorEmbed('Invalid Role', 'Could not find the specified role.')]
            });
          }
          config.queen_role_id = roleId;
          updateMessage = `Queen role set to ${role}`;
        }
        break;

      case 'reminder_channel_id':
        if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
          config.reminder_channel_id = null;
          updateMessage = 'Reminder channel removed';
        } else {
          const channelId = value.replace(/[<#>]/g, '');
          const channel = message.guild.channels.cache.get(channelId);
          if (!channel) {
            return message.reply({
              embeds: [errorEmbed('Invalid Channel', 'Could not find the specified channel.')]
            });
          }
          config.reminder_channel_id = channelId;
          updateMessage = `Reminder channel set to ${channel}`;
        }
        break;

      default:
        return message.reply({
          embeds: [errorEmbed('Invalid Setting', 'Available settings: prefix, embed_color, xp_rate, max_list_size, bot_owner_role, user_access_role, ai_api_key, patron_role_id, queen_role_id, reminder_channel_id')]
        });
    }

    setServerConfig(guildId, config);

    await message.reply({
      embeds: [successEmbed('Configuration Updated', updateMessage)]
    });

    logger.info(`User ${message.author.username} updated ${setting} to ${value} in ${message.guild.name}`);
  } catch (error) {
    logger.error('Error updating config:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to update configuration. Please try again.')]
    });
  }
}
