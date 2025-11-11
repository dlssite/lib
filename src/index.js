import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import connectDB from './database/connect.js';
import logger from './utils/logger.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Load slash commands
const slashCommandsPath = join(__dirname, 'commands', 'slash');
await loadCommandsFromPath(slashCommandsPath, client.commands);

// Load prefix commands (for reference, not stored in client.commands)
const prefixCommandsPath = join(__dirname, 'commands', 'prefix');
await loadCommandsFromPath(prefixCommandsPath, null);

// Helper function to load commands from a path
async function loadCommandsFromPath(commandsPath, collection) {
  try {
    const commandFolders = readdirSync(commandsPath);

    for (const folder of commandFolders) {
      const folderPath = join(commandsPath, folder);
      const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = join(folderPath, file);
        try {
          const command = await import(pathToFileURL(filePath).href);

          if (collection && 'data' in command && 'execute' in command) {
            collection.set(command.data.name, command);
          } else if (!collection && 'name' in command && 'run' in command) {
            // Prefix commands loaded for reference
          } else {
            logger.warn(`The command at ${filePath} is missing required properties.`);
          }
        } catch (importError) {
          logger.warn(`Failed to load command ${filePath}:`, importError.message);
        }
      }
    }
  } catch (error) {
    logger.warn(`Could not load commands from ${commandsPath}:`, error.message);
  }
}

// Load events
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);
  const event = await import(pathToFileURL(filePath).href);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Connect to database
connectDB();

// Login
client.login(process.env.BOT_TOKEN);
