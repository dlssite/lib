import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { setServerConfig } from '../../../slash/admin/config.js';
import logger from '../../../utils/logger.js';

export const name = 'setup';
export const description = 'Run initial server setup for the bot';

export async function run(message, args) {
  if (!message.member.permissions.has('ADMINISTRATOR')) {
    return message.reply({
      embeds: [errorEmbed('Permission Denied', 'You need Administrator permissions to run setup.')]
    });
  }

  const guildId = message.guild.id;

  try {
    // Set default configuration
    const defaultConfig = {
      prefix: '!',
      max_list_size: 50,
      max_groups_per_server: 10,
      embed_color: '#0099ff',
      allow_nsfw: false,
      log_channel: null,
      bot_owner_role: null,
      user_access_role: null
    };

    setServerConfig(guildId, defaultConfig);

    // Create welcome message
    const setupMessage = `
🎉 **Arcanum Bot Setup Complete!**

**Default Settings:**
• Prefix: \`!\`
• Max reading list size: 50 titles
• Max groups per server: 10
• Embed color: #0099ff

**Getting Started:**
• Use \`!add <title> <type>\` to add books to your list
• Use \`!mylist\` to view your reading list
• Use \`!creategroup <name> <genre>\` to create reading groups
• Use \`!help\` for more commands

**Admin Commands:**
• \`!config\` - Change bot settings
• \`!announce\` - Send announcements
• \`!roles\` - Manage reading roles

Enjoy reading with Arcanum! 📚✨
    `.trim();

    await message.reply({
      embeds: [successEmbed('Setup Complete', setupMessage)]
    });

    logger.info(`Server ${message.guild.name} completed bot setup`);
  } catch (error) {
    logger.error('Error during setup:', error);
    await message.reply({
      embeds: [errorEmbed('Setup Failed', 'Failed to complete setup. Please try again.')]
    });
  }
}
