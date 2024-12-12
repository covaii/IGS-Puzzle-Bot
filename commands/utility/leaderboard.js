const { SlashCommandBuilder } = require('discord.js');
const { leaderBoard } = require('../../display.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Shows the puzzle leaderboard'),
	async execute(interaction) {
		// console.log(interaction);
		// userID = interaction.user.id;
		// console.log(userID);
		// user = await interaction.client.users.fetch(userID);
		// user.send("test");
		// await interaction.reply("Pong");

        leaderBoard(interaction,interaction.client,interaction.guildId,10);
	},
};
