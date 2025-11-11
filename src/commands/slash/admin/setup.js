import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Initial server setup for Arcanum bot')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
      embeds: [errorEmbed('Permission Denied', 'You need Administrator permissions to use this command.')],
      ephemeral: true,
    });
  }

  try {
    // Create reading-related roles if they don't exist
    const rolesToCreate = [
      { name: 'Book Reader', color: '#0099ff' },
      { name: 'Manga Reader', color: '#ff69b4' },
      { name: 'Webtoon Reader', color: '#ffa500' },
      { name: 'Reading Group Leader', color: '#00ff00' },
    ];

    const createdRoles = [];

    for (const roleData of rolesToCreate) {
      const existingRole = interaction.guild.roles.cache.find(role => role.name === roleData.name);
      if (!existingRole) {
        const role = await interaction.guild.roles.create({
          name: roleData.name,
          color: parseInt(roleData.color.replace('#', ''), 16),
          reason: 'Arcanum bot setup',
        });
        createdRoles.push(role.name);
      }
    }

    // Try to create a reading channel
    let readingChannel;
    const existingChannel = interaction.guild.channels.cache.find(ch => ch.name === 'reading-discussion');
    if (!existingChannel) {
      readingChannel = await interaction.guild.channels.create({
        name: 'reading-discussion',
        type: 0, // TEXT channel
        topic: 'Discuss books, manga, and reading progress! 📚',
        reason: 'Arcanum bot setup',
      });
    }

    const embed = successEmbed('Setup Complete', 'Arcanum bot has been set up for your server!');

    if (createdRoles.length > 0) {
      embed.addFields({
        name: 'Created Roles',
        value: createdRoles.join(', '),
        inline: false,
      });
    }

    if (readingChannel) {
      embed.addFields({
        name: 'Created Channel',
        value: `#${readingChannel.name}`,
        inline: false,
      });
    }

    embed.addFields({
      name: 'Next Steps',
      value: 'Users can now use `/add` to start tracking their reading!\nUse `/config` to customize bot settings.',
      inline: false,
    });

    await interaction.reply({ embeds: [embed] });

    logger.info(`Server setup completed for ${interaction.guild.name} by ${interaction.user.username}`);
  } catch (error) {
    logger.error('Error during setup:', error);

    const reply = {
      embeds: [errorEmbed('Setup Failed', 'Failed to complete server setup. Please check bot permissions and try again.')],
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}
