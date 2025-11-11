import { groupListEmbed, errorEmbed } from '../../../utils/embeds.js';
import Group from '../../../database/models/Group.js';
import logger from '../../../utils/logger.js';

export const name = 'listgroups';
export const description = 'List all available reading groups';

export async function run(message, args) {
  try {
    const groups = await Group.find({ channelId: { $exists: true } }).sort({ createdAt: -1 });

    if (groups.length === 0) {
      return message.reply({
        embeds: [errorEmbed('No Groups', 'No reading groups have been created yet!\nUse `!creategroup <name> <genre>` to create one.')]
      });
    }

    const formattedGroups = groups.map((group, index) => {
      return `${index + 1}. **${group.name}**\n   Genre: ${group.genre} | Type: ${group.type} | Members: ${group.members.length}`;
    }).join('\n\n');

    await message.reply({
      embeds: [groupListEmbed(formattedGroups, groups.length)]
    });

    logger.info(`User ${message.author.username} listed ${groups.length} groups`);
  } catch (error) {
    logger.error('Error listing groups:', error);
    await message.reply({
      embeds: [errorEmbed('Error', 'Failed to fetch groups. Please try again.')]
    });
  }
}
