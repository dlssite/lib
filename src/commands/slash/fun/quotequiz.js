import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { quotableAPI } from '../../../utils/apiClients.js';
import { errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

// In-memory storage for active quizzes (in production, use database)
const activeQuizzes = new Map();

export const data = new SlashCommandBuilder()
  .setName('quotequiz')
  .setDescription('Start a quote guessing game');

export async function execute(interaction) {
  const channelId = interaction.channelId;
  const userId = interaction.user.id;

  // Check if there's already an active quiz in this channel
  if (activeQuizzes.has(channelId)) {
    return await interaction.reply({
      embeds: [errorEmbed('Quiz Active', 'There\'s already an active quote quiz in this channel!')],
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  try {
    // Get a random quote
    const quote = await quotableAPI.getRandomQuote();

    if (!quote) {
      return await interaction.editReply({
        embeds: [errorEmbed('No Quote', 'Could not fetch a quote for the quiz. Please try again later.')],
      });
    }

    // Create quiz data
    const quizData = {
      quote: quote.content,
      author: quote.author,
      participants: new Set(),
      startTime: Date.now(),
      timeout: setTimeout(async () => {
        activeQuizzes.delete(channelId);
        await interaction.followUp({
          embeds: [new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('⏰ Time\'s Up!')
            .setDescription(`No one guessed the quote correctly!\n\n**Quote:** "${quote.content}"\n**Author:** ${quote.author}`)
            .setTimestamp()
          ]
        });
      }, 60000) // 1 minute timeout
    };

    activeQuizzes.set(channelId, quizData);

    // Send the quiz
    const embed = new EmbedBuilder()
      .setColor('#800080')
      .setTitle('💭 Quote Quiz!')
      .setDescription(`**Quote:** "${quote.content}"\n\n**Who said this?** Reply with your guess!\nYou have 1 minute to answer.`)
      .setFooter({ text: 'Type your guess in the chat!' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Set up message collector for guesses
    const filter = (msg) => !msg.author.bot && msg.channelId === channelId;

    const collector = interaction.channel.createMessageCollector({
      filter,
      time: 60000
    });

    collector.on('collect', async (msg) => {
      const guess = msg.content.toLowerCase().trim();
      const correctAuthor = quote.author.toLowerCase();

      if (guess === correctAuthor || correctAuthor.includes(guess) || guess.includes(correctAuthor)) {
        // Correct guess
        activeQuizzes.delete(channelId);
        clearTimeout(quizData.timeout);
        collector.stop();

        // Award XP (would need to integrate with user system)
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('🎉 Correct!')
          .setDescription(`${msg.author.username} got it right!\n\n**Quote:** "${quote.content}"\n**Author:** ${quote.author}`)
          .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
      }
    });

    collector.on('end', (collected) => {
      if (activeQuizzes.has(channelId)) {
        activeQuizzes.delete(channelId);
      }
    });

  } catch (error) {
    logger.error('Error starting quote quiz:', error);
    await interaction.editReply({
      embeds: [errorEmbed('Error', 'Failed to start quote quiz. Please try again.')],
    });
  }
}
