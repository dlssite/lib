import logger from '../utils/logger.js';

export const name = 'clientReady';
export const once = true;

export async function execute(client) {
  logger.info(`Logged in as ${client.user.tag}!`);
  logger.info(`Bot is online and ready in ${client.guilds.cache.size} servers.`);

  // Register slash commands globally
  try {
    const commands = [];
    for (const [name, command] of client.commands) {
      commands.push(command.data.toJSON());
    }

    await client.application.commands.set(commands);
    logger.info(`Successfully registered ${commands.length} slash commands globally.`);
  } catch (error) {
    logger.error('Error registering slash commands:', error);
  }

  // Set bot status
  client.user.setPresence({
    activities: [{ name: 'Reading at Arcanum', type: 0 }],
    status: 'online',
  });
}
