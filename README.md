# IGS Puzzle Bot

A Discord bot for practicing Go (Baduk/Weiqi) puzzles from the Online Go Server (OGS). This bot helps server administrators manage and share Go puzzles with their community members, tracks user progress, and maintains a leaderboard.

## Commands

### Admin Commands
- `/add_puzzle [id] [position]` - Add an OGS puzzle to the server queue
- `/announce_puzzle [channel] [role?]` - Announce the current puzzle in a specific channel
- `/next_puzzle` - Move to the next puzzle in the queue

### User Commands
- `/play` - Start solving the current puzzle
- `/show_puzzle [id]` - Display information about a specific puzzle
- `/leaderboard` - View the server's puzzle solving leaderboard

### Puzzle Solving Commands (DM)
- `![coordinate]` - Make a move (e.g., `!Q4`)
- `!reset` - Reset the current puzzle
- `!undo` - Undo your last move

## Setup

1. Clone the repository
```bash
git clone https://github.com/Skwidder/IGS-Puzzle-Bot.git
```

2. Install dependencies
```bash
npm install
```

3. Set up prerequisites:
   - For help creating a Discord bot and getting your token and client ID, follow the [Discord.js Guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html)
   - For help setting up MongoDB Atlas, follow the [MongoDB Atlas Tutorial](https://www.mongodb.com/resources/products/platform/mongodb-atlas-tutorial)

4. Create a `config.json` file with your credentials:
```json
{
    "discord_token": "your-discord-token",
    "discord_clientId": "your-client-id",
    "discord_guildId": "your-guild-id",
    "dbConnString": "your-mongodb-conn-string"
}
```

5. Deploy commands
```bash
node deploy-commands.js
```

6. Start the bot
```bash
node index.js
```

## Technical Requirements

- Node.js 18.17.0 or higher
- MongoDB database
- Discord bot token and application
- Dependencies:
  - discord.js
  - mongodb
  - sharp
  - axios
  - wgo

## Development

This bot uses:
- Discord.js for bot functionality
- MongoDB for data persistence
- Sharp for image processing
- WGO.js for Go game logic
- SVG for board rendering

## License

MIT License

## Author

Skwidder

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Submit a pull request

## Support

For issues and feature requests, please use the GitHub issues page.
