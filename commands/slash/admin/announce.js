import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('announce')
  .setDescription('Send an announcement to a channel')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(option =>
    option.setName('message')
      .setDescription('The announcement message')
      .setRequired(true))
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('Channel to send announcement to')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('title')
      .setDescription('Announcement title (optional)')
      .setRequired(false));

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
      embeds: [errorEmbed('Permission Denied', 'You need Administrator permissions to use this command.')],
      ephemeral: true,
    });
  }

  const message = interaction.options.getString('message');
  const channel = interaction.options.getChannel('channel');
  const title = interaction.options.getString('title') || '📢 Announcement';

  if (channel.type !== 0) { // TEXT channel
    return await interaction.reply({
      embeds: [errorEmbed('Invalid Channel', 'Please select a text channel for announcements.')],
      ephemeral: true,
    });
  }

  try {
    const embed = new EmbedBuilder()
      .setColor('#ff4500')
      .setTitle(title)
      .setDescription(message)
      .setFooter({ text: `Announced by ${interaction.user.username}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    await interaction.reply({
      embeds: [successEmbed('Announcement Sent', `Announcement sent to #${channel.name}!`)],
      ephemeral: true,
    });

    logger.info(`Announcement sent to #${channel.name} in ${interaction.guild.name} by ${interaction.user.username}`);
  } catch (error) {
    logger.error('Error sending announcement:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to send announcement. Please check bot permissions.')],
      ephemeral: true,
    });
  }
}
