import cron from 'node-cron';
import logger from './logger.js';

// In-memory storage for scheduled tasks (in production, use database)
const scheduledTasks = new Map();

// Schedule a reminder
export const scheduleReminder = async (userId, message, time, client, channelId = null, taskId = null) => {
  if (!taskId) {
    taskId = `remind-${userId}-${Date.now()}`;
  }

  let cronExpression;
  if (typeof time === 'number') {
    // time is delay in milliseconds
    const futureDate = new Date(Date.now() + time);
    cronExpression = `${futureDate.getMinutes()} ${futureDate.getHours()} ${futureDate.getDate()} ${futureDate.getMonth() + 1} *`;
  } else {
    // time is cronExpression
    cronExpression = time;
  }

  const task = cron.schedule(cronExpression, async () => {
    try {
      // Send DM to user
      const user = await client.users.fetch(userId);
      await user.send(`⏰ Reminder: ${message}`);

      // Send reminder to server channel if provided
      if (channelId) {
        const channel = await client.channels.fetch(channelId);
        await channel.send(`<@${userId}> ⏰ Reminder: ${message}`);
      }

      logger.info(`Sent reminder to user ${userId}: ${message}`);
    } catch (error) {
      logger.error(`Failed to send reminder to user ${userId}:`, error);
    }
  }, {
    scheduled: false, // Don't start immediately
  });

  scheduledTasks.set(taskId, task);
  task.start();
  logger.info(`Scheduled reminder ${taskId} for user ${userId}`);
};

// Cancel a scheduled task
export const cancelScheduledTask = (taskId) => {
  const task = scheduledTasks.get(taskId);
  if (task) {
    task.destroy();
    scheduledTasks.delete(taskId);
    logger.info(`Cancelled scheduled task ${taskId}`);
  }
};

// Schedule daily quote in a channel
export const scheduleDailyQuote = (channelId, cronExpression = '0 9 * * *') => {
  const task = cron.schedule(cronExpression, async () => {
    // This would post a daily quote in the specified channel
    logger.info(`Posting daily quote in channel ${channelId}`);
  });

  scheduledTasks.set(`daily-quote-${channelId}`, task);
  task.start();
};

// Schedule release notifications
export const scheduleReleaseCheck = (title, type, cronExpression = '0 */6 * * *') => {
  const task = cron.schedule(cronExpression, async () => {
    // Check for new releases
    logger.info(`Checking for new releases of ${title} (${type})`);
  });

  scheduledTasks.set(`release-${title}`, task);
  task.start();
};

// Get all scheduled tasks
export const getScheduledTasks = () => {
  return Array.from(scheduledTasks.keys());
};

// Stop all scheduled tasks
export const stopAllTasks = () => {
  for (const [taskId, task] of scheduledTasks) {
    task.destroy();
    logger.info(`Stopped task ${taskId}`);
  }
  scheduledTasks.clear();
};

// Additional exports for backward compatibility
export const subscribeToReleases = (userId, title, channelId) => {
  // Placeholder for subscribing to releases
  logger.info(`Subscribed user ${userId} to releases for ${title} in channel ${channelId}`);
};

export const unsubscribeFromReleases = (userId, title) => {
  // Placeholder for unsubscribing from releases
  logger.info(`Unsubscribed user ${userId} from releases for ${title}`);
};
