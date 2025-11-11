import { SlashCommandBuilder } from 'discord.js';
import { quotableAPI } from '../../../utils/apiClients.js';
import { quoteEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('randomquote')
  .setDescription('Get a random quote from literature');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const quote = await quotableAPI.getRandomQuote();

    if (!quote) {
      return await interaction.editReply({
        embeds: [errorEmbed('No Quote', 'Could not fetch a quote right now. Please try again later.')],
      });
    }

    const embed = quoteEmbed(quote);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error fetching random quote:', error);
    await interaction.editReply({
      embeds: [errorEmbed('Error', 'Failed to fetch quote. Please try again.')],
    });
  }
}
