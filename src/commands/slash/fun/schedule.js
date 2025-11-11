import { SlashCommandBuilder } from 'discord.js';
import { scheduleReminder } from '../../../utils/scheduler.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('schedule')
  .setDescription('Create a reading schedule')
  .addStringOption(option =>
    option.setName('title')
      .setDescription('Title to create schedule for')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('chapters')
      .setDescription('Total chapters to read')
      .setRequired(true)
      .setMinValue(1))
  .addIntegerOption(option =>
    option.setName('weeks')
      .setDescription('Number of weeks to complete')
      .setRequired(true)
      .setMinValue(1));

export async function execute(interaction) {
  const title = interaction.options.getString('title');
  const totalChapters = interaction.options.getInteger('chapters');
  const weeks = interaction.options.getInteger('weeks');

  const chaptersPerWeek = Math.ceil(totalChapters / weeks);
  const userId = interaction.user.id;

  try {
    // Schedule reminders for each week
    for (let week = 1; week <= weeks; week++) {
      const chaptersThisWeek = Math.min(chaptersPerWeek, totalChapters - (week - 1) * chaptersPerWeek);
      const message = `Reading reminder: ${chaptersThisWeek} chapters of "${title}" this week (Week ${week}/${weeks})`;

      // Schedule for every 7 days starting from now
      const daysFromNow = week * 7;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysFromNow);

      const cronExpression = `${futureDate.getMinutes()} ${futureDate.getHours()} ${futureDate.getDate()} ${futureDate.getMonth() + 1} *`;

      const taskId = `schedule-${userId}-${title.replace(/\s+/g, '-')}-week${week}`;
      scheduleReminder(userId, message, cronExpression, interaction.client, null, taskId);
    }

    const embed = successEmbed('Schedule Created', `Created a ${weeks}-week reading schedule for "${title}"!\n\n**Plan:** ${chaptersPerWeek} chapters per week\n**Total:** ${totalChapters} chapters\n\nYou'll receive reminders each week.`);

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error creating schedule:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to create reading schedule. Please try again.')],
      ephemeral: true,
    });
  }
}
