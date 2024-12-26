const { showPuzzle } = require("../../display.js");
const { SlashCommandBuilder, Attachment, InteractionContextType } = require('discord.js');
const fs = require('fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('show_puzzle')
		.setDescription('Displays a image of the puzzle with the given ID')
        .addIntegerOption(option => 
			option
				.setName('id')
				.setDescription("ID of the puzzle to show")
                .setRequired(true))
        .setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        id = interaction.options.getInteger('id');
        if(isNaN(id)){
            await interaction.reply("Id must be a number");
            return;
        }

        await showPuzzle(interaction,id);
        
	},
};
