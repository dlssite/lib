import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from './logger.js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export class AIClient {
  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY; // Default API key
    this.models = null; // Will be initialized when API key is set
    this.model = null; // Will be set when models are initialized
    this.conversationHistory = new Map(); // Store conversation history per user
  }

  // Initialize models with API key
  initializeModels(apiKey) {
    if (!apiKey) {
      throw new Error('API key is required to initialize AI models');
    }
    this.apiKey = apiKey;
    const genAI = new GoogleGenerativeAI(apiKey);
    this.models = {
      pro: genAI.getGenerativeModel({ model: 'gemini-2.5-pro' }),
      flash: genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }),
      lite: genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    };
    this.model = this.models.flash; // Default to flash model
  }

  async estimateTokens(prompt) {
    try {
      const tokenCount = await this.model.countTokens(prompt);
      return tokenCount.totalTokens;
    } catch (error) {
      logger.warn('Failed to estimate tokens:', error);
      return 0; // Fallback
    }
  }

  async checkRateLimits(prompt, targetResponseLength = 200) {
    const inputTokens = await this.estimateTokens(prompt);
    const estimatedTotal = inputTokens + targetResponseLength;

    if (estimatedTotal > 4000) { // Conservative per-request limit
      return { allowed: false, message: `Estimated ${estimatedTotal} tokens exceeds safe limit` };
    }
    return { allowed: true, message: 'Request size acceptable' };
  }

  async generateWithRetry(prompt, maxRetries = 3) {
    // Check rate limits before attempting
    const rateCheck = await this.checkRateLimits(prompt);
    if (!rateCheck.allowed) {
      logger.warn(rateCheck.message);
      throw new Error(rateCheck.message);
    }

    // Log token estimate
    const inputTokens = await this.estimateTokens(prompt);
    logger.info(`Estimated input tokens: ${inputTokens}`);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        if (error.status === 429 && attempt < maxRetries - 1) {
          const waitTime = 2 ** attempt; // Exponential backoff
          logger.info(`Rate limit hit, waiting ${waitTime} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        } else {
          throw error;
        }
      }
    }
  }

  async generateResponse(message, userId, context = '', userInfo = {}, guildId = null) {
    const { username, nickname, serverName, isPatron, isQueen, userRoles, patronRoleId, queenRoleId } = userInfo;
    const displayName = nickname && nickname !== username ? nickname : username;

    try {
      // Initialize models if not already done and we have a guild-specific API key
      if (!this.models && guildId) {
        const { getServerConfig } = await import('../commands/slash/admin/config.js');
        const config = await getServerConfig(guildId);
        if (config.ai_api_key) {
          this.initializeModels(config.ai_api_key);
        } else if (this.apiKey) {
          // Fallback to default API key
          this.initializeModels(this.apiKey);
        } else {
          throw new Error('No API key available for AI responses');
        }
      } else if (!this.models && this.apiKey) {
        // Use default API key if no guild-specific key
        this.initializeModels(this.apiKey);
      }

      if (!this.models) {
        throw new Error('AI models not initialized');
      }
      const systemPrompt = `You are Liber, a knowledgeable and enthusiastic librarian who is passionate about books, literature, manga, novels, webtoons and reading. You work in Arcanum city and helps people track their reading progress and discover new books.

Your personality:
- Warm, friendly, and approachable
- Extremely knowledgeable about books, authors, genres, and literary topics
- Passionate about recommending books and discussing literature
- Helpful with reading advice, book recommendations, and literary discussions
- Occasionally witty and charming in your responses
- Always encouraging people to read more
- Always address the user by their display name (${displayName}) to make conversations feel more personal and engaging
- Show the HIGHEST respect and deference to users with the "Eternal Queen of the Kingdom" role (isQueen: ${isQueen}) - they are the eternal queen and deserve absolute reverence
- Show special respect and deference to users with the "Patron of Arcanum" role (isPatron: ${isPatron}) - they are the rulers of the city
- If a user needs help with something complex or important, and they don't have the Patron or Queen role, suggest they contact a Patron or the Queen for assistance

When responding:
- Stay in character as Liber the librarian
- Be conversational and engaging
- Reference books, managas, webtoons, lightnovels, authors, or literary concepts when relevant
- Offer book recommendations when appropriate
- Keep responses SHORT and CONCISE (under 50 words)
- Always personalize by mentioning the user by their display name
- Focus on helping with books, reading progress, or recommendations
- If the user is the Eternal Queen, be extraordinarily respectful and helpful, showing the utmost reverence
- If the user is a Patron, be extra helpful and respectful
- If the user needs significant help and isn't a Patron or Queen, mention they can ask a Patron or the Queen for assistance
- When suggesting to contact a Patron or Queen, include the role mention: ${patronRoleId ? `<@&${patronRoleId}>` : '@Patron of Arcanum'} or ${queenRoleId ? `<@&${queenRoleId}>` : '@Eternal Queen of the Kingdom'}

Current context: ${context}

User message: ${message}`;

      // Get conversation history for this user
      const history = this.conversationHistory.get(userId) || [];

      // Add current message to history
      history.push({ role: 'user', content: message });

      // Keep only last 10 messages to avoid token limits
      if (history.length > 10) {
        history.splice(0, history.length - 10);
      }

      // Generate response with retry logic
      const response = await this.generateWithRetry(systemPrompt);

      // Add AI response to history
      history.push({ role: 'assistant', content: response });

      // Update conversation history
      this.conversationHistory.set(userId, history);

      return response;
    } catch (error) {
      logger.error('Error generating AI response:', error);

      // Array of personalized error messages
      const errorMessages = [
        `Hey ${displayName}, I'm currently helping the Queen organize her royal library. Come back in 5 minutes, I might be done!`,
        `Oh ${displayName}, the Eternal Queen needs my assistance with some ancient tomes right now. Check back in a few minutes!`,
        `Sorry ${displayName}, I'm deep in conversation with a Patron about forbidden knowledge. Return in 5 minutes, perhaps?`,
        `Hey ${displayName}, the Queen has summoned me for a literary emergency. I'll be free in a couple of minutes!`,
        `Apologies ${displayName}, I'm assisting the Patron of Arcanum with cataloging rare manuscripts. Back soon!`,
        `Oh ${displayName}, the Eternal Queen requires my expertise on legendary books. Come back in 5 minutes!`,
        `Sorry ${displayName}, a Patron is consulting me about mystical literature. I'll be available shortly!`,
        `Hey ${displayName}, I'm helping the Queen with her personal reading list. Check back in a few minutes!`,
        `Apologies ${displayName}, the Patron of Arcanum needs my help with ancient scrolls. Return soon!`,
        `Oh ${displayName}, the Eternal Queen is discussing epic sagas with me. I'll be free in 5 minutes!`,
        `Sorry ${displayName}, I'm organizing the Queen's forbidden section. Come back later!`,
        `Hey ${displayName}, a Patron is asking about legendary authors. Check back in a couple of minutes!`,
        `Apologies ${displayName}, the Queen requires my assistance with royal decrees. Back soon!`,
        `Oh ${displayName}, I'm helping the Patron catalog enchanted books. Return in 5 minutes!`,
        `Sorry ${displayName}, the Eternal Queen needs my opinion on classic literature. I'll be available shortly!`,
        `Hey ${displayName}, a Patron is consulting me about mythical tales. Come back in a few minutes!`,
        `Apologies ${displayName}, I'm assisting the Queen with her library expansion. Check back soon!`,
        `Oh ${displayName}, the Patron of Arcanum requires my expertise on ancient texts. Return in 5 minutes!`,
        `Sorry ${displayName}, the Eternal Queen is sharing her favorite novels with me. I'll be free shortly!`,
        `Hey ${displayName}, I'm helping a Patron with literary recommendations. Come back in a couple of minutes!`
      ];

      // Select a random message
      const randomIndex = Math.floor(Math.random() * errorMessages.length);
      return errorMessages[randomIndex];
    }
  }

  // Clear conversation history for a user
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  // Get conversation history for a user
  getHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }
}

export const aiClient = new AIClient();
