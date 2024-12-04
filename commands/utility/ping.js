const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		// console.log(interaction);
		userID = interaction.user.id;
		console.log(userID);
		user = await interaction.client.users.fetch(userID);
		user.send("test");
		await interaction.reply("Pong");
	},
};
