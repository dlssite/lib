import { getServerConfig, hasUserAccess } from '../commands/slash/admin/config.js';
import { checkQuizAnswer } from '../commands/prefix/fun/quotequiz.js';
import { aiClient } from '../utils/aiClient.js';
import logger from '../utils/logger.js';

export const name = 'messageCreate';

export async function execute(message) {
  // Ignore bot messages and DMs
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const config = await getServerConfig(guildId);
  const prefix = config.prefix || '!';

  // Check if message starts with prefix
  if (!message.content.startsWith(prefix)) {
    // Check if it's a quiz answer
    const isQuizAnswer = await checkQuizAnswer(message);
    if (isQuizAnswer) return;

    // Check if bot is mentioned or message is a reply to bot
    const isMentioned = message.mentions.has(message.client.user);
    const isReplyToBot = message.reference && message.reference.messageId;

    if (isMentioned || isReplyToBot) {
      // Check if it's a reply to the bot
      let isReplyToBotMessage = false;
      if (isReplyToBot) {
        try {
          const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
          isReplyToBotMessage = repliedMessage.author.id === message.client.user.id;
        } catch (error) {
          logger.error('Error fetching replied message:', error);
        }
      }

      if (isMentioned || isReplyToBotMessage) {
        // Check user access permissions for AI responses
        const hasAccess = await hasUserAccess(message.member, guildId);
        if (!hasAccess) {
          const accessRole = config.user_access_role ? `<@&${config.user_access_role}>` : 'a specific role';

          return await message.reply({
            embeds: [{
              color: 0xff0000,
              title: '❌ Access Denied',
              description: `You need ${accessRole} to use this bot.\n\nPlease contact a server administrator to get the required role.`,
              footer: { text: 'Contact an admin if you believe this is an error.' }
            }]
          });
        }

        // Check if it's a reply to an embed from the bot
        let embedContext = '';
        if (isReplyToBotMessage) {
          try {
            const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
            if (repliedMessage.embeds && repliedMessage.embeds.length > 0) {
              const embed = repliedMessage.embeds[0];
              embedContext = `Replying to embed: Title: "${embed.title || 'No title'}", Description: "${embed.description || 'No description'}", Fields: ${embed.fields ? embed.fields.map(f => `${f.name}: ${f.value}`).join(', ') : 'None'}`;
            }
          } catch (error) {
            logger.error('Error fetching embed context:', error);
          }
        }

        // Generate AI response
        const userMessage = message.content.replace(/<@!?[0-9]+>/g, '').trim();
        if (userMessage) {
          try {
            // Start typing indicator
            await message.channel.sendTyping();

            // Check if user has special roles - use server config first, fallback to env
            const config = await getServerConfig(message.guild.id);
            const patronRoleId = config.patron_role_id || process.env.PATRON_OF_ARCANUM_ROLE_ID;
            const queenRoleId = config.queen_role_id || process.env.ETERNAL_QUEEN_ROLE_ID;
            const isPatron = patronRoleId && message.member?.roles.cache.has(patronRoleId);
            const isQueen = queenRoleId && message.member?.roles.cache.has(queenRoleId);
            const userRoles = message.member?.roles.cache.map(role => role.name).join(', ') || 'none';

            const aiResponse = await aiClient.generateResponse(
              userMessage,
              message.author.id,
              `User is in server: ${message.guild.name}, channel: ${message.channel.name}, user roles: ${userRoles}, is patron: ${isPatron}, is queen: ${isQueen}${embedContext ? '. ' + embedContext : ''}`,
              {
                username: message.author.username,
                nickname: message.member?.displayName || message.author.username,
                serverName: message.guild.name,
                isPatron: isPatron,
                isQueen: isQueen,
                userRoles: userRoles,
                patronRoleId: patronRoleId,
                queenRoleId: queenRoleId
              },
              message.guild.id
            );

            await message.reply(aiResponse);
          } catch (error) {
            logger.error('Error with AI response:', error);
            await message.reply("I'm sorry, I'm having trouble thinking right now. Could you try again in a moment? 📚");
          }
        } else if (embedContext) {
          // User replied to embed but didn't provide text - give a fun response
          const funResponses = [
            "Ah, I see you're pointing at that embed! 📖 What would you like to know about it?",
            "That embed looks interesting! What questions do you have about it? 🤔",
            "Great choice! That embed contains some fascinating information. What would you like me to explain? 📚",
            "I see you've spotted that embed! It's full of useful details. What would you like to discuss about it? ✨"
          ];
          const randomResponse = funResponses[Math.floor(Math.random() * funResponses.length)];
          await message.reply(randomResponse);
        }
        return;
      }
    }

    return;
  }

  // Check user access permissions
  const hasAccess = await hasUserAccess(message.member, guildId);
  if (!hasAccess) {
    const accessRole = config.user_access_role ? `<@&${config.user_access_role}>` : 'a specific role';

    return await message.reply({
      embeds: [{
        color: 0xff0000,
        title: '❌ Access Denied',
        description: `You need ${accessRole} to use this bot.\n\nPlease contact a server administrator to get the required role.`,
        footer: { text: 'Contact an admin if you believe this is an error.' }
      }]
    });
  }

  // Extract command and args
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Find the command
  let command;
  try {
    // Try prefix commands first
    const prefixCommandPath = `../commands/prefix/${getCommandCategory(commandName)}/${commandName}.js`;
    command = await import(prefixCommandPath);
  } catch (error) {
    // Command not found
    return;
  }

  if (command && command.run) {
    try {
      await command.run(message, args);
    } catch (error) {
      logger.error(`Error executing prefix command ${commandName}:`, error);
      await message.reply({
        embeds: [{
          color: 0xff0000,
          title: '❌ Error',
          description: 'There was an error executing this command.'
        }]
      });
    }
  }
}

// Helper function to determine command category
function getCommandCategory(commandName) {
  const categories = {
    // Books
    add: 'books',
    mylist: 'books',
    progress: 'books',
    info: 'books',
    remove: 'books',

    // Community
    creategroup: 'community',
    join: 'community',
    listgroups: 'community',
    challenge: 'community',
    leaderboard: 'community',

    // Fun
    recommend: 'fun',
    randomquote: 'fun',
    poll: 'fun',
    remind: 'fun',
    schedule: 'fun',
    releases: 'fun',
    quotequiz: 'fun',
    help: 'fun',

    // Admin
    setup: 'admin',
    announce: 'admin',
    roles: 'admin',
    config: 'admin'
  };

  return categories[commandName] || 'unknown';
}
