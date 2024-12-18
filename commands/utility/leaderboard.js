const { SlashCommandBuilder,  InteractionContextType } = require('discord.js');
const { leaderBoard } = require('../../display.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Shows the puzzle leaderboard')
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        leaderBoard(interaction,interaction.client,interaction.guildId,10);
	},
};
