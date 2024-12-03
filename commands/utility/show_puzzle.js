const { GoBoardImageBuilder } = require("../../board.js");
const { getPuzzle } = require("../../OGS.js");
const { SlashCommandBuilder, Attachment } = require('discord.js');
const fs = require('fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('show_puzzle')
		.setDescription('Displays a image of the puzzle with the given ID')
        .addIntegerOption(option => 
			option
				.setName('id')
				.setDescription("ID of the puzzle to show")
                .setRequired(true)),
	async execute(interaction) {
        id = interaction.options.getInteger('id');
        if(isNaN(id)){
            await interaction.reply("Id must be a number");
            return;
        }

        response = await getPuzzle(id);
        whiteStonesInital = response.data.puzzle.initial_state.white;
        blackStonesInital = response.data.puzzle.initial_state.black;

        const board = new GoBoardImageBuilder(19);

        stones = [];
        for (let i = 0; i < whiteStonesInital.length; i = i + 2){
            stones.push({pos: whiteStonesInital[i] + whiteStonesInital[i+1], color: 'white'});
        }

        for (let i = 0; i < blackStonesInital.length; i = i + 2){
            stones.push({pos: blackStonesInital[i] + blackStonesInital[i+1], color: 'black'});
        }

        await board.saveAsPNG(stones,interaction.id + ".png");

        await interaction.reply({files : [{attachment: interaction.id + ".png"}] });

        fs.unlink(interaction.id + ".png", function (err){
            if (err) throw err;
        });
	},
};
