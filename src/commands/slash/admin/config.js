import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';
import Config from '../../../database/models/Config.js';

export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Configure bot settings for this server')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('set')
      .setDescription('Set a configuration option')
      .addStringOption(option =>
        option.setName('option')
          .setDescription('Configuration option')
          .setRequired(true)
          .addChoices(
            { name: 'Prefix', value: 'prefix' },
            { name: 'Embed Color', value: 'embed_color' },
            { name: 'XP Rate', value: 'xp_rate' },
            { name: 'Max Reading List Size', value: 'max_list_size' },
            { name: 'Bot Owner Role', value: 'bot_owner_role' },
            { name: 'User Access Role', value: 'user_access_role' },
            { name: 'AI API Key', value: 'ai_api_key' },
            { name: 'Patron Role ID', value: 'patron_role_id' },
            { name: 'Queen Role ID', value: 'queen_role_id' },
            { name: 'Reminder Channel', value: 'reminder_channel_id' }
          ))
      .addStringOption(option =>
        option.setName('value')
          .setDescription('Value for the option')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('View current configuration'));

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
      embeds: [errorEmbed('Permission Denied', 'You need Administrator permissions to use this command.')],
      ephemeral: true,
    });
  }

  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guildId;

  try {
    if (subcommand === 'set') {
      const option = interaction.options.getString('option');
      const value = interaction.options.getString('value');

      // Get or create config for this server
      let config = await Config.findOne({ guildId });
      if (!config) {
        config = new Config({ guildId });
      }

      // Validate and set the option
      switch (option) {
        case 'prefix':
          if (value.length > 5) {
            return await interaction.reply({
              embeds: [errorEmbed('Invalid Value', 'Prefix must be 5 characters or less.')],
              ephemeral: true,
            });
          }
          config.prefix = value;
          break;

        case 'embed_color':
          if (!/^#[0-9A-F]{6}$/i.test(value)) {
            return await interaction.reply({
              embeds: [errorEmbed('Invalid Color', 'Please provide a valid hex color code (e.g., #ff0000).')],
              ephemeral: true,
            });
          }
          config.embed_color = value;
          break;

        case 'xp_rate':
          const xpRate = parseFloat(value);
          if (isNaN(xpRate) || xpRate < 0.1 || xpRate > 5) {
            return await interaction.reply({
              embeds: [errorEmbed('Invalid Value', 'XP rate must be between 0.1 and 5.')],
              ephemeral: true,
            });
          }
          config.xp_rate = xpRate;
          break;

        case 'max_list_size':
          const maxSize = parseInt(value);
          if (isNaN(maxSize) || maxSize < 10 || maxSize > 200) {
            return await interaction.reply({
              embeds: [errorEmbed('Invalid Value', 'Max list size must be between 10 and 200.')],
              ephemeral: true,
            });
          }
          config.max_list_size = maxSize;
          break;

        case 'bot_owner_role':
          if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
            config.bot_owner_role = null;
          } else {
            // Extract role ID from mention
            const roleId = value.replace(/[<@&>]/g, '');
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
              return await interaction.reply({
                embeds: [errorEmbed('Invalid Role', 'Could not find the specified role. Please use @role or the role ID.')],
                ephemeral: true,
              });
            }
            config.bot_owner_role = roleId;
          }
          break;

        case 'user_access_role':
          if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
            config.user_access_role = null;
          } else {
            // Extract role ID from mention
            const roleId = value.replace(/[<@&>]/g, '');
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
              return await interaction.reply({
                embeds: [errorEmbed('Invalid Role', 'Could not find the specified role. Please use @role or the role ID.')],
                ephemeral: true,
              });
            }
            config.user_access_role = roleId;
          }
          break;

        case 'ai_api_key':
          if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
            config.ai_api_key = null;
          } else {
            // Basic validation for API key format (should be a string)
            if (value.length < 10) {
              return await interaction.reply({
                embeds: [errorEmbed('Invalid API Key', 'API key must be at least 10 characters long.')],
                ephemeral: true,
              });
            }
            config.ai_api_key = value;
          }
          break;

        case 'patron_role_id':
          if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
            config.patron_role_id = null;
          } else {
            // Extract role ID from mention
            const roleId = value.replace(/[<@&>]/g, '');
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
              return await interaction.reply({
                embeds: [errorEmbed('Invalid Role', 'Could not find the specified role. Please use @role or the role ID.')],
                ephemeral: true,
              });
            }
            config.patron_role_id = roleId;
          }
          break;

        case 'queen_role_id':
          if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
            config.queen_role_id = null;
          } else {
            // Extract role ID from mention
            const roleId = value.replace(/[<@&>]/g, '');
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
              return await interaction.reply({
                embeds: [errorEmbed('Invalid Role', 'Could not find the specified role. Please use @role or the role ID.')],
                ephemeral: true,
              });
            }
            config.queen_role_id = roleId;
          }
          break;

        case 'reminder_channel_id':
          if (value.toLowerCase() === 'none' || value.toLowerCase() === 'null') {
            config.reminder_channel_id = null;
          } else {
            // Extract channel ID from mention
            const channelId = value.replace(/[<#>]/g, '');
            const channel = interaction.guild.channels.cache.get(channelId);
            if (!channel) {
              return await interaction.reply({
                embeds: [errorEmbed('Invalid Channel', 'Could not find the specified channel. Please use #channel or the channel ID.')],
                ephemeral: true,
              });
            }
            config.reminder_channel_id = channelId;
          }
          break;
      }

      await config.save();

      await interaction.reply({
        embeds: [successEmbed('Configuration Updated', `Set ${option} to: ${value}`)],
      });

    } else if (subcommand === 'view') {
      const config = await Config.findOne({ guildId }) || {
        prefix: '!',
        embed_color: '#0099ff',
        xp_rate: 1,
        max_list_size: 50,
        bot_owner_role: null,
        user_access_role: null,
        ai_api_key: null,
        patron_role_id: null,
        queen_role_id: null,
        reminder_channel_id: null,
      };

      const embed = successEmbed('Current Configuration', 'Here are the current bot settings for this server:');

      const botOwnerRole = config.bot_owner_role ? `<@&${config.bot_owner_role}>` : 'Not set';
      const userAccessRole = config.user_access_role ? `<@&${config.user_access_role}>` : 'Not set (everyone can use)';
      const aiApiKey = config.ai_api_key ? 'Set (hidden)' : 'Not set';
      const patronRole = config.patron_role_id ? `<@&${config.patron_role_id}>` : 'Not set';
      const queenRole = config.queen_role_id ? `<@&${config.queen_role_id}>` : 'Not set';
      const reminderChannel = config.reminder_channel_id ? `<#${config.reminder_channel_id}>` : 'Not set (DM only)';

      embed.addFields(
        { name: 'Prefix', value: config.prefix, inline: true },
        { name: 'Embed Color', value: config.embed_color, inline: true },
        { name: 'XP Rate', value: config.xp_rate.toString(), inline: true },
        { name: 'Max Reading List Size', value: config.max_list_size.toString(), inline: true },
        { name: 'Bot Owner Role', value: botOwnerRole, inline: true },
        { name: 'User Access Role', value: userAccessRole, inline: true },
        { name: 'AI API Key', value: aiApiKey, inline: true },
        { name: 'Patron Role', value: patronRole, inline: true },
        { name: 'Queen Role', value: queenRole, inline: true },
        { name: 'Reminder Channel', value: reminderChannel, inline: true }
      );

      await interaction.reply({ embeds: [embed] });
    }

    logger.info(`Config command used by ${interaction.user.username} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error with config command:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to process configuration. Please try again.')],
      ephemeral: true,
    });
  }
}

// Function to get server config
export async function getServerConfig(guildId) {
  try {
    const config = await Config.findOne({ guildId });
    return config || {
      prefix: '!',
      embed_color: '#0099ff',
      xp_rate: 1,
      max_list_size: 50,
      bot_owner_role: null,
      user_access_role: null,
      ai_api_key: null,
      patron_role_id: null,
      queen_role_id: null,
      reminder_channel_id: null,
    };
  } catch (error) {
    logger.error('Error getting server config:', error);
    return {
      prefix: '!',
      embed_color: '#0099ff',
      xp_rate: 1,
      max_list_size: 50,
      bot_owner_role: null,
      user_access_role: null,
      ai_api_key: null,
      patron_role_id: null,
      queen_role_id: null,
      reminder_channel_id: null,
    };
  }
}

// Function to set server config
export async function setServerConfig(guildId, configData) {
  try {
    let config = await Config.findOne({ guildId });
    if (!config) {
      config = new Config({ guildId, ...configData });
    } else {
      Object.assign(config, configData);
    }
    await config.save();
    return config;
  } catch (error) {
    logger.error('Error setting server config:', error);
    throw error;
  }
}

// Function to check if user has access to bot commands
export async function hasUserAccess(member, guildId) {
  const config = await getServerConfig(guildId);

  // If no user access role is set, everyone can use the bot
  if (!config.user_access_role) {
    return true;
  }

  // Check if user has the required role
  return member.roles.cache.has(config.user_access_role);
}

// Function to check if user is a bot owner/admin
export async function isBotOwner(member, guildId) {
  const config = await getServerConfig(guildId);

  // If bot owner role is set, check if user has it
  if (config.bot_owner_role) {
    return member.roles.cache.has(config.bot_owner_role);
  }

  // Otherwise, check for administrator permission
  return member.permissions.has('ADMINISTRATOR');
}
