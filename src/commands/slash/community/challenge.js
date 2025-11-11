import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Challenge from '../../../database/models/Challenge.js';
import { successEmbed, errorEmbed, challengeEmbed } from '../../../utils/embeds.js';
import logger from '../../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('challenge')
  .setDescription('Create or join reading challenges')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new reading challenge')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the challenge')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('goal')
          .setDescription('Number of items to read')
          .setRequired(true)
          .setMinValue(1))
      .addStringOption(option =>
        option.setName('type')
          .setDescription('Type of media')
          .setRequired(true)
          .addChoices(
            { name: 'Book', value: 'book' },
            { name: 'Manga', value: 'manga' },
            { name: 'Webtoon', value: 'webtoon' },
            { name: 'Comic', value: 'comic' },
            { name: 'Light Novel', value: 'lightnovel' }
          ))
      .addStringOption(option =>
        option.setName('description')
          .setDescription('Description of the challenge')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('join')
      .setDescription('Join an existing challenge')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the challenge')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List available challenges'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  try {
    if (subcommand === 'create') {
      const name = interaction.options.getString('name');
      const goal = interaction.options.getInteger('goal');
      const type = interaction.options.getString('type');
      const description = interaction.options.getString('description');

      // Check if challenge name already exists
      const existingChallenge = await Challenge.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existingChallenge) {
        return await interaction.reply({
          embeds: [errorEmbed('Challenge Exists', 'A challenge with this name already exists!')],
          ephemeral: true,
        });
      }

      const challenge = new Challenge({
        name,
        description,
        goal,
        type,
        participants: [{ userId, progress: 0 }],
        createdBy: userId,
      });

      await challenge.save();

      logger.info(`User ${interaction.user.username} created challenge "${name}"`);

      await interaction.reply({
        embeds: [successEmbed('Challenge Created', `Successfully created challenge "${name}"! Others can now join using \`/challenge join name:"${name}"\`.`)]
      });

    } else if (subcommand === 'join') {
      const challengeName = interaction.options.getString('name');

      const challenge = await Challenge.findOne({ name: { $regex: new RegExp(`^${challengeName}$`, 'i') } });

      if (!challenge) {
        return await interaction.reply({
          embeds: [errorEmbed('Challenge Not Found', `Could not find a challenge named "${challengeName}".`)],
          ephemeral: true,
        });
      }

      const existingParticipant = challenge.participants.find(p => p.userId === userId);
      if (existingParticipant) {
        return await interaction.reply({
          embeds: [errorEmbed('Already Joined', 'You are already participating in this challenge!')],
          ephemeral: true,
        });
      }

      challenge.participants.push({ userId, progress: 0 });
      await challenge.save();

      logger.info(`User ${interaction.user.username} joined challenge "${challengeName}"`);

      await interaction.reply({
        embeds: [successEmbed('Joined Challenge', `Successfully joined "${challenge.name}"! Good luck!`)],
      });

    } else if (subcommand === 'list') {
      const challenges = await Challenge.find({}).limit(10);

      if (challenges.length === 0) {
        return await interaction.reply({
          embeds: [errorEmbed('No Challenges', 'No reading challenges have been created yet! Use `/challenge create` to make one.')],
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#ff4500')
        .setTitle('🎯 Available Challenges')
        .setTimestamp();

      const challengeList = challenges.map(challenge =>
        `**${challenge.name}**\nGoal: ${challenge.goal} ${challenge.type}s | Participants: ${challenge.participants.length}`
      ).join('\n\n');

      embed.setDescription(challengeList);

      await interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    logger.error('Error with challenge command:', error);
    await interaction.reply({
      embeds: [errorEmbed('Error', 'Failed to process challenge command. Please try again.')],
      ephemeral: true,
    });
  }
}
