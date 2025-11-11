import { EmbedBuilder } from 'discord.js';

// Success embed
export const successEmbed = (title, description) => {
  return new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
};

// Error embed
export const errorEmbed = (title, description) => {
  return new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
};

// Info embed
export const infoEmbed = (title, description) => {
  return new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setTimestamp();
};

// Book info embed
export const bookInfoEmbed = (bookData) => {
  const embed = new EmbedBuilder()
    .setColor('#ff9900')
    .setTitle(bookData.title || 'Unknown Title')
    .setDescription(bookData.description ? bookData.description.substring(0, 500) + '...' : 'No description available')
    .setTimestamp();

  if (bookData.cover) {
    embed.setImage(bookData.cover);
  }

  if (bookData.author) {
    embed.addFields({ name: 'Author', value: bookData.author, inline: true });
  }

  if (bookData.type) {
    embed.addFields({ name: 'Type', value: bookData.type, inline: true });
  }

  if (bookData.totalChapters) {
    embed.addFields({ name: 'Chapters', value: bookData.totalChapters.toString(), inline: true });
  }

  return embed;
};

// Reading list embed
export const readingListEmbed = (username, formattedList, listLength) => {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`${username}'s Reading List (${listLength} items)`)
    .setTimestamp();

  if (listLength === 0) {
    embed.setDescription('No books in reading list yet!');
    return embed;
  }

  embed.setDescription(formattedList);
  return embed;
};

// Leaderboard embed
export const leaderboardEmbed = (users) => {
  const embed = new EmbedBuilder()
    .setColor('#ffd700')
    .setTitle('🏆 Reading Leaderboard')
    .setTimestamp();

  if (users.length === 0) {
    embed.setDescription('No users found!');
    return embed;
  }

  const fields = users.slice(0, 10).map((user, index) => ({
    name: `${index + 1}. ${user.username}`,
    value: `XP: ${user.xp}\nBadges: ${user.badges.length}`,
    inline: true,
  }));

  embed.addFields(fields);
  return embed;
};

// Group embed
export const groupEmbed = (group) => {
  const embed = new EmbedBuilder()
    .setColor('#ff69b4')
    .setTitle(`📚 ${group.name}`)
    .setDescription(`Genre: ${group.genre || 'General'}\nType: ${group.type || 'Mixed'}\nMembers: ${group.members.length}`)
    .setTimestamp();

  if (group.currentRead) {
    embed.addFields({
      name: 'Current Read',
      value: `${group.currentRead.title} (${group.currentRead.type})`,
      inline: false,
    });
  }

  if (group.schedule) {
    embed.addFields({
      name: 'Schedule',
      value: group.schedule,
      inline: false,
    });
  }

  return embed;
};

// Challenge embed
export const challengeEmbed = (challenge) => {
  const embed = new EmbedBuilder()
    .setColor('#ff4500')
    .setTitle(`🎯 ${challenge.name}`)
    .setDescription(challenge.description || 'No description')
    .addFields(
      { name: 'Goal', value: `${challenge.goal} ${challenge.type}s`, inline: true },
      { name: 'Participants', value: challenge.participants.length.toString(), inline: true },
      { name: 'Ends', value: challenge.endDate ? challenge.endDate.toDateString() : 'Ongoing', inline: true }
    )
    .setTimestamp();

  return embed;
};

// Quote embed
export const quoteEmbed = (quote) => {
  if (!quote || !quote.content) {
    return new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Error')
      .setDescription('Unable to fetch a quote at this time.')
      .setTimestamp();
  }

  const embed = new EmbedBuilder()
    .setColor('#800080')
    .setTitle('💭 Random Quote')
    .setDescription(`"${quote.content}"\n\n— ${quote.author}`)
    .setTimestamp();

  return embed;
};

// Group list embed
export const groupListEmbed = (formattedGroups, groupCount) => {
  const embed = new EmbedBuilder()
    .setColor('#ff69b4')
    .setTitle(`📚 Available Reading Groups (${groupCount})`)
    .setDescription(formattedGroups)
    .setTimestamp();

  return embed;
};
