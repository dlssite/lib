import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { getRandomQuote } from '../../../utils/apiClients.js';
import logger from '../../../utils/logger.js';

// Simple in-memory storage for active quizzes (in production, use database)
const activeQuizzes = new Map();

export const name = 'quotequiz';
export const description = 'Play a quote guessing game';

export async function run(message, args) {
  const userId = message.author.id;
  const channelId = message.channel.id;

  // Check if user already has an active quiz
  if (activeQuizzes.has(userId)) {
    return message.reply({
      embeds: [errorEmbed('Quiz in Progress', 'You already have an active quiz! Finish it first or wait for it to timeout.')]
    });
  }

  try {
    const quote = await getRandomQuote();

    // Create a quiz entry
    const quiz = {
      quote: quote.content,
      author: quote.author,
      channelId,
      startTime: Date.now(),
      timeout: setTimeout(() => {
        activeQuizzes.delete(userId);
        message.channel.send({
          embeds: [errorEmbed('Quiz Timeout', `Time's up! The quote was:\n\n*"${quote.content}"*\n— ${quote.author}`)]
        });
      }, 60000) // 1 minute timeout
    };

    activeQuizzes.set(userId, quiz);

    // Send the quiz
    const quizText = `🤔 **Quote Quiz!**\n\n*"${quote.content.replace(quote.author.split(' ')[0], '_____')}"*\n\nWho said this quote? You have 1 minute to answer!\n\n*Reply with the author's name (first name or full name)*`;

    await message.reply({
      embeds: [successEmbed('Quote Quiz Started', quizText)]
    });

    logger.info(`User ${message.author.username} started a quote quiz`);
  } catch (error) {
    logger.error('Error starting quote quiz:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to start quote quiz. Please try again.')]
    });
  }
}

// Function to check quiz answers (called from messageCreate event)
export async function checkQuizAnswer(message) {
  const userId = message.author.id;
  const quiz = activeQuizzes.get(userId);

  if (!quiz || quiz.channelId !== message.channel.id) return false;

  const userAnswer = message.content.toLowerCase().trim();
  const correctAuthor = quiz.author.toLowerCase();

  // Check if answer is correct (allow partial matches)
  const isCorrect = correctAuthor.includes(userAnswer) || userAnswer.includes(correctAuthor.split(' ')[0]);

  // Clear the quiz
  clearTimeout(quiz.timeout);
  activeQuizzes.delete(userId);

  if (isCorrect) {
    await message.reply({
      embeds: [successEmbed('Correct! 🎉', `Well done! The quote was indeed by **${quiz.author}**\n\n*"${quiz.quote}"*\n— ${quiz.author}`)]
    });

    // Add XP for correct answer
    const User = (await import('../../../database/models/User.js')).default;
    await User.findOneAndUpdate({ userId }, { $inc: { xp: 5 } });

    logger.info(`User ${message.author.username} answered quote quiz correctly`);
    return true;
  } else {
    await message.reply({
      embeds: [errorEmbed('Incorrect! 😅', `Sorry, that's not correct. The quote was by **${quiz.author}**\n\n*"${quiz.quote}"*\n— ${quiz.author}`)]
    });

    logger.info(`User ${message.author.username} answered quote quiz incorrectly`);
    return true;
  }
}
