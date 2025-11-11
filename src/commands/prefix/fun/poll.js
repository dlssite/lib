import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const name = 'poll';
export const description = 'Create a poll for the server';

export async function run(message, args) {
  if (!message.member.permissions.has('MANAGE_MESSAGES')) {
    return message.reply({
      embeds: [errorEmbed('Permission Denied', 'You need the "Manage Messages" permission to create polls.')]
    });
  }

  if (args.length < 3) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage: `!poll <question> <option1> <option2> [option3] [option4]`\nExample: `!poll "Next book to read?" "Harry Potter" "Lord of the Rings" "The Hobbit"`')]
    });
  }

  const question = args[0];
  const options = args.slice(1);

  if (options.length > 4) {
    return message.reply({
      embeds: [errorEmbed('Too Many Options', 'Polls can have a maximum of 4 options.')]
    });
  }

  const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

  const pollText = `📊 **${question}**\n\n${options.map((option, index) => `${emojiNumbers[index]} ${option}`).join('\n')}\n\n*Vote by reacting with the corresponding emoji!*`;

  try {
    const pollMessage = await message.channel.send({
      embeds: [successEmbed('Poll Created', pollText)]
    });

    // Add reactions
    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(emojiNumbers[i]);
    }

    // Delete the command message
    await message.delete();

    logger.info(`User ${message.author.username} created a poll: "${question}"`);
  } catch (error) {
    logger.error('Error creating poll:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to create poll. Please try again.')]
    });
  }
}
