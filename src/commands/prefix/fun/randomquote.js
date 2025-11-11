import { quoteEmbed, errorEmbed } from '../../../utils/embeds.js';
import { getRandomQuote } from '../../../utils/apiClients.js';
import logger from '../../../utils/logger.js';

export const name = 'randomquote';
export const description = 'Get a random quote from literature or manga';

export async function run(message, args) {
  try {
    const quote = await getRandomQuote();

    await message.reply({
      embeds: [quoteEmbed(quote)]
    });

    logger.info(`User ${message.author.username} requested a random quote`);
  } catch (error) {
    logger.error('Error getting random quote:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to get a random quote. Please try again.')]
    });
  }
}
