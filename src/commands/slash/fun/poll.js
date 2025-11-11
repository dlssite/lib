import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Create a poll for the server')
  .addStringOption(option =>
    option.setName('question')
      .setDescription('The poll question')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('option1')
      .setDescription('First option')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('option2')
      .setDescription('Second option')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('option3')
      .setDescription('Third option (optional)')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('option4')
      .setDescription('Fourth option (optional)')
      .setRequired(false));

export async function execute(interaction) {
  const question = interaction.options.getString('question');
  const options = [];

  for (let i = 1; i <= 4; i++) {
    const option = interaction.options.getString(`option${i}`);
    if (option) options.push(option);
  }

  if (options.length < 2) {
    return await interaction.reply({
      embeds: [errorEmbed('Invalid Poll', 'You must provide at least 2 options for the poll.')],
      ephemeral: true,
    });
  }

  try {
    const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

    const embed = new EmbedBuilder()
      .setColor('#ffa500')
      .setTitle('📊 Poll')
      .setDescription(`**${question}**\n\n${options.map((opt, i) => `${emojiNumbers[i]} ${opt}`).join('\n')}`)
      .setFooter({ text: `Poll created by ${interaction.user.username}` })
      .setTimestamp();

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });

    // Add reactions
    for (let i = 0; i < options.length; i++) {
      await message.react(emojiNumbers[i]);
    }

    logger.info(`User ${interaction.user.username} created a poll: "${question}"`);
  } catch (error) {
    logger.error('Error creating poll:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to create poll. Please try again.')],
      ephemeral: true,
    });
  }
}
