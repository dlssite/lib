import logger from '../utils/logger.js';
import { hasUserAccess, isBotOwner, getServerConfig } from '../commands/slash/admin/config.js';
import { EmbedBuilder } from 'discord.js';

export const name = 'interactionCreate';

export async function execute(interaction) {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    // Check user access permissions
    const hasAccess = await hasUserAccess(interaction.member, interaction.guildId);
    if (!hasAccess) {
      const config = await getServerConfig(interaction.guildId);
      const accessRole = config.user_access_role ? `<@&${config.user_access_role}>` : 'a specific role';

      return await interaction.reply({
        embeds: [{
          color: 0xff0000,
          title: '❌ Access Denied',
          description: `You need ${accessRole} to use this bot.\n\nPlease contact a server administrator to get the required role.`,
          footer: { text: 'Contact an admin if you believe this is an error.' }
        }],
        flags: 64, // ephemeral
      });
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(error);

      const reply = {
        content: 'There was an error while executing this command!',
        flags: 64, // ephemeral
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  } else if (interaction.isStringSelectMenu()) {
    // Handle help menu selection
    if (interaction.customId === 'help_category') {
      const category = interaction.values[0];
      let embed;

      switch (category) {
        case 'books':
          embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('📚 Books Commands')
            .setDescription('Commands for managing your reading list:')
            .addFields(
              { name: '/add <title>', value: 'Add a book to your reading list', inline: true },
              { name: '/mylist', value: 'View your reading list', inline: true },
              { name: '/progress <title> <progress>', value: 'Update reading progress', inline: true },
              { name: '/info <title>', value: 'Get information about a book', inline: true },
              { name: '/remove <title>', value: 'Remove a book from your list', inline: true }
            );
          break;

        case 'community':
          embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('👥 Community Commands')
            .setDescription('Commands for groups and challenges:')
            .addFields(
              { name: '/creategroup <name>', value: 'Create a reading group', inline: true },
              { name: '/join <group>', value: 'Join a reading group', inline: true },
              { name: '/listgroups', value: 'List available groups', inline: true },
              { name: '/challenge <name>', value: 'Create or join a reading challenge', inline: true },
              { name: '/leaderboard', value: 'View reading leaderboard', inline: true }
            );
          break;

        case 'fun':
          embed = new EmbedBuilder()
            .setColor('#ff69b4')
            .setTitle('🎉 Fun Commands')
            .setDescription('Fun commands and utilities:')
            .addFields(
              { name: '/recommend', value: 'Get book recommendations', inline: true },
              { name: '/randomquote', value: 'Get a random quote', inline: true },
              { name: '/poll <question>', value: 'Create a poll', inline: true },
              { name: '/remind <message> <time>', value: 'Set a reminder', inline: true },
              { name: '/schedule <title> <time>', value: 'Schedule reading time', inline: true },
              { name: '/releases <title>', value: 'Subscribe to release notifications', inline: true },
              { name: '/quotequiz', value: 'Play a quote guessing game', inline: true }
            );
          break;

        case 'admin':
          embed = new EmbedBuilder()
            .setColor('#ff4500')
            .setTitle('⚙️ Admin Commands')
            .setDescription('Administrative commands (Admin only):')
            .addFields(
              { name: '/setup', value: 'Initial bot setup', inline: true },
              { name: '/config', value: 'Configure bot settings', inline: true },
              { name: '/roles', value: 'Manage user roles', inline: true },
              { name: '/announce <message>', value: 'Send an announcement', inline: true }
            );
          break;

        default:
          embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Error')
            .setDescription('Invalid category selected.');
      }

      await interaction.update({
        embeds: [embed],
        components: interaction.message.components, // Keep the select menu
      });
    }
  }
}
