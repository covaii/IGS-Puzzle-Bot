const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { resetPuzzle, moveQueue,getServerQueue } = require("../../database.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('next_puzzle')
		.setDescription('Move the server to next puzzle in the queue. This will remove the current puzzle')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.ModerateMembers),
	async execute(interaction) {
        const queue = await getServerQueue(interaction.client,interaction.guildId);

        if(queue.length <= 1){
            await interaction.reply("Not another puzzle in queue! Please add one with /add_puzzle, then run this command again");
            return;
        }
        
        resetPuzzle(interaction.client,interaction.guild.id);
        moveQueue(interaction.client,interaction.guild.id);

        await interaction.reply("Server moved to next puzzle!");
	},
};
