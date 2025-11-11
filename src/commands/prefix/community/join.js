import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import Group from '../../../database/models/Group.js';
import User from '../../../database/models/User.js';
import logger from '../../../utils/logger.js';

export const name = 'join';
export const description = 'Join a reading group';

export async function run(message, args) {
  const userId = message.author.id;

  if (args.length === 0) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage: `!join <group_name>`\nUse `!listgroups` to see available groups.')]
    });
  }

  const groupName = args.join(' ');

  try {
    const group = await Group.findOne({ name: new RegExp(`^${groupName}$`, 'i'), channelId: { $exists: true } });
    if (!group) {
      return message.reply({
        embeds: [errorEmbed('Group Not Found', `Could not find a group named "${groupName}". Use \`!listgroups\` to see available groups.`)]
      });
    }

    // Check if user is already a member
    if (group.members.includes(userId)) {
      return message.reply({
        embeds: [errorEmbed('Already Member', 'You are already a member of this group!')]
      });
    }

    // Check max members
    if (group.members.length >= 50) {
      return message.reply({
        embeds: [errorEmbed('Group Full', 'This group is full (max 50 members)!')]
      });
    }

    group.members.push(userId);
    await group.save();

    // Add XP for joining
    await User.findOneAndUpdate({ userId }, { $inc: { xp: 2 } });

    await message.reply({
      embeds: [successEmbed('Joined Group', `Successfully joined "${group.name}"!\n\nGenre: ${group.genre}\nType: ${group.type}\nMembers: ${group.members.length}`)]
    });

    logger.info(`User ${message.author.username} joined group "${group.name}"`);
  } catch (error) {
    logger.error('Error joining group:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to join the group. Please try again.')]
    });
  }
}
