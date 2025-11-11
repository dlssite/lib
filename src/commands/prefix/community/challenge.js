import { successEmbed, errorEmbed, challengeEmbed } from '../../../utils/embeds.js';
import Challenge from '../../../database/models/Challenge.js';
import User from '../../../database/models/User.js';
import logger from '../../../utils/logger.js';

export const name = 'challenge';
export const description = 'Create or join reading challenges';

export async function run(message, args) {
  const userId = message.author.id;
  const subcommand = args[0]?.toLowerCase();

  if (!subcommand || !['create', 'join', 'list'].includes(subcommand)) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage:\n`!challenge create <name> <goal> <type>` - Create a challenge\n`!challenge join <name>` - Join a challenge\n`!challenge list` - List active challenges')]
    });
  }

  try {
    if (subcommand === 'create') {
      if (args.length < 4) {
        return message.reply({
          embeds: [errorEmbed('Invalid Usage', 'Usage: `!challenge create <name> <goal> <type>`\nExample: `!challenge create "Read 5 Books" 5 book`')]
        });
      }

      const name = args[1];
      const goal = parseInt(args[2]);
      const type = args[3].toLowerCase();

      const validTypes = ['book', 'manga', 'webtoon', 'comic', 'lightnovel', 'mixed'];
      if (!validTypes.includes(type)) {
        return message.reply({
          embeds: [errorEmbed('Invalid Type', `Valid types: ${validTypes.join(', ')}`)]
        });
      }

      if (isNaN(goal) || goal <= 0) {
        return message.reply({
          embeds: [errorEmbed('Invalid Goal', 'Goal must be a positive number.')]
        });
      }

      // Check if challenge name exists
      const existingChallenge = await Challenge.findOne({ name: new RegExp(`^${name}$`, 'i') });
      if (existingChallenge) {
        return message.reply({
          embeds: [errorEmbed('Challenge Exists', 'A challenge with this name already exists!')]
        });
      }

      const challenge = new Challenge({
        name,
        description: `Read ${goal} ${type}${goal > 1 ? 's' : ''}`,
        goal,
        type,
        participants: [{ userId, progress: 0 }],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: userId
      });

      await challenge.save();

      // Add XP to creator
      await User.findOneAndUpdate({ userId }, { $inc: { xp: 5 } });

      await message.reply({
        embeds: [successEmbed('Challenge Created', `Created challenge "${name}"!\n\nGoal: Read ${goal} ${type}${goal > 1 ? 's' : ''}\nDuration: 30 days\n\nUse \`!challenge join "${name}"\` to participate.`)]
      });

      logger.info(`User ${message.author.username} created challenge "${name}"`);

    } else if (subcommand === 'join') {
      if (args.length < 2) {
        return message.reply({
          embeds: [errorEmbed('Invalid Usage', 'Usage: `!challenge join <name>`')]
        });
      }

      const challengeName = args.slice(1).join(' ');
      const challenge = await Challenge.findOne({ name: new RegExp(`^${challengeName}$`, 'i') });

      if (!challenge) {
        return message.reply({
          embeds: [errorEmbed('Challenge Not Found', `Could not find challenge "${challengeName}".`)]
        });
      }

      // Check if user already joined
      const existingParticipant = challenge.participants.find(p => p.userId === userId);
      if (existingParticipant) {
        return message.reply({
          embeds: [errorEmbed('Already Joined', 'You have already joined this challenge!')]
        });
      }

      challenge.participants.push({ userId, progress: 0 });
      await challenge.save();

      // Add XP for joining
      await User.findOneAndUpdate({ userId }, { $inc: { xp: 2 } });

      await message.reply({
        embeds: [successEmbed('Joined Challenge', `Joined challenge "${challenge.name}"!\n\nGoal: ${challenge.description}\nParticipants: ${challenge.participants.length}`)]
      });

      logger.info(`User ${message.author.username} joined challenge "${challenge.name}"`);

    } else if (subcommand === 'list') {
      const challenges = await Challenge.find({ endDate: { $gt: new Date() } }).sort({ createdAt: -1 });

      if (challenges.length === 0) {
        return message.reply({
          embeds: [errorEmbed('No Challenges', 'No active challenges found!\nUse `!challenge create <name> <goal> <type>` to create one.')]
        });
      }

      const formattedChallenges = challenges.map((challenge, index) => {
        const daysLeft = Math.ceil((challenge.endDate - new Date()) / (1000 * 60 * 60 * 24));
        return `${index + 1}. **${challenge.name}**\n   Goal: ${challenge.description}\n   Type: ${challenge.type}\n   Participants: ${challenge.participants.length}\n   Days left: ${daysLeft}`;
      }).join('\n\n');

      await message.reply({
        embeds: [challengeEmbed('Active Challenges', formattedChallenges)]
      });

      logger.info(`User ${message.author.username} listed ${challenges.length} challenges`);
    }
  } catch (error) {
    logger.error('Error with challenge command:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to process challenge command. Please try again.')]
    });
  }
}
