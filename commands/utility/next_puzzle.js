const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { nextPuzzle } = require("../../database.js")
const { getAllPuzzlesInCollection } = require("../../OGS.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('next_puzzle')
		.setDescription('Move the server to next puzzle in the queue. This will remove the current puzzle')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.ModerateMembers),
	async execute(interaction) {
		try{
        	const response = await nextPuzzle(interaction.client,interaction.guildId);
		}catch(error){
			await interaction.reply(error.message);
			return;
		}
        await interaction.reply(response);
	},
};
