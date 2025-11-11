# Arcanum Discord Bot

A comprehensive Discord bot for readers to track their reading progress, join communities, participate in challenges, and discover new books, manga, webtoons, comics, and light novels.

## Features

- 📚 Track reading progress for multiple media types
- 👥 Create and join reading groups
- 🏆 Participate in reading challenges
- 🎮 Fun commands like quote quizzes and recommendations
- 🔔 Reading reminders and release notifications
- ⚙️ Admin tools for server management
- 🏅 XP and badge system for gamification

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a Discord bot at https://discord.com/developers/applications
4. Set up a MongoDB database (local or cloud like MongoDB Atlas)
5. Get API keys for Google Books API
6. Fill in the `.env` file with your credentials
7. Run the bot: `npm start`

## Role-Based Access Control

The bot supports role-based access control for enhanced server management:

### Bot Owner Role
- Set with `/config set option:bot_owner_role value:@RoleName`
- Users with this role have full administrative access to bot settings
- If not set, Administrator permission is required

### User Access Role
- Set with `/config set option:user_access_role value:@RoleName`
- Only users with this role can use bot commands
- If not set, everyone can use the bot
- Users without the role get a clear message showing which role they need

### Example Setup
```
/setup                                    # Initial setup
/config set option:user_access_role value:@Reader  # Restrict to readers only
/config set option:bot_owner_role value:@BookAdmin # Set bot admins
```

## Environment Variables

- `BOT_TOKEN`: Your Discord bot token
- `MONGO_URI`: MongoDB connection string
- `GOOGLE_BOOKS_KEY`: Google Books API key

## Commands

### Books/Manga/Webtoon Management
- `/add` - Add a title to your reading list
- `/mylist` - View your reading list
- `/progress` - Update reading progress
- `/info` - Get information about a title
- `/remove` - Remove a title from your list

### Community
- `/creategroup` - Create a reading group
- `/join` - Join a reading group
- `/listgroups` - List available groups
- `/challenge` - Create or join challenges
- `/leaderboard` - View top readers

### Fun
- `/recommend` - Get recommendations
- `/quotequiz` - Play quote guessing game
- `/randomquote` - Get random quotes
- `/poll` - Create polls
- `/remind` - Set reading reminders
- `/schedule` - Create reading schedules
- `/releases` - Subscribe to release notifications

### Admin
- `/setup` - Initial server setup
- `/roles` - Manage roles
- `/announce` - Send announcements
- `/config` - Configure bot settings

## Hosting

This bot is designed to be easily deployable to platforms like Render, Railway, or Replit. Make sure to set environment variables in your hosting platform's dashboard.

## Contributing

Feel free to submit issues and pull requests!

## License

MIT License
