import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { getServerConfig } from '../../slash/admin/config.js';
import Group from '../../../database/models/Group.js';
import User from '../../../database/models/User.js';
import logger from '../../../utils/logger.js';

export const name = 'creategroup';
export const description = 'Create a reading group';

export async function run(message, args) {
  const userId = message.author.id;
  const guildId = message.guild.id;

  if (args.length < 2) {
    return message.reply({
      embeds: [errorEmbed('Invalid Usage', 'Usage: `!creategroup <name> <genre> [type]`\nExample: `!creategroup "Fantasy Readers" fantasy book`')]
    });
  }

  const name = args[0];
  const genre = args[1];
  const type = args[2] || 'mixed';

  const validTypes = ['book', 'manga', 'webtoon', 'comic', 'lightnovel', 'mixed'];
  if (!validTypes.includes(type.toLowerCase())) {
    return message.reply({
      embeds: [errorEmbed('Invalid Type', `Valid types: ${validTypes.join(', ')}`)]
    });
  }

  try {
    // Check if group name already exists in this server
    const existingGroup = await Group.findOne({ name: new RegExp(`^${name}$`, 'i'), channelId: { $exists: true } });
    if (existingGroup) {
      return message.reply({
        embeds: [errorEmbed('Group Exists', 'A group with this name already exists!')]
      });
    }

    // Check max groups per server
    const config = getServerConfig(guildId);
    const serverGroups = await Group.countDocuments({ channelId: { $exists: true } });
    if (serverGroups >= config.max_groups_per_server) {
      return message.reply({
        embeds: [errorEmbed('Server Limit Reached', `This server has reached the maximum number of groups (${config.max_groups_per_server})!`)]
      });
    }

    // Create the group
    const group = new Group({
      name,
      genre,
      type: type.toLowerCase(),
      members: [userId],
      channelId: message.channel.id,
      createdBy: userId
    });

    await group.save();

    // Add XP to creator
    await User.findOneAndUpdate({ userId }, { $inc: { xp: 5 } });

    await message.reply({
      embeds: [successEmbed('Group Created', `Created reading group "${name}" for ${genre} ${type}s!\n\nMembers: 1\nUse \`!join "${name}"\` to join this group.`)]
    });

    logger.info(`User ${message.author.username} created group "${name}"`);
  } catch (error) {
    logger.error('Error creating group:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to create reading group. Please try again.')]
    });
  }
}
