import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { infoEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const name = 'help';
export const description = 'Get help with bot commands';

export async function run(message, args) {
  try {
    const embed = infoEmbed('Arcanum Bot Help', 'Select a category below to see available commands:');

    const selectMenu = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help_category')
          .setPlaceholder('Choose a category')
          .addOptions([
            {
              label: '📚 Books',
              description: 'Commands for managing your reading list',
              value: 'books',
            },
            {
              label: '👥 Community',
              description: 'Commands for groups and challenges',
              value: 'community',
            },
            {
              label: '🎉 Fun',
              description: 'Fun commands and utilities',
              value: 'fun',
            },
            {
              label: '⚙️ Admin',
              description: 'Administrative commands',
              value: 'admin',
            },
          ])
      );

    await message.reply({
      embeds: [embed],
      components: [selectMenu],
    });
  } catch (error) {
    logger.error('Error with help command:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to show help menu. Please try again.')],
    });
  }
}
