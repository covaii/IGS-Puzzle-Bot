const { SlashCommandBuilder,  InteractionContextType } = require('discord.js');
const { leaderBoard } = require('../../display.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Shows the puzzle leaderboard')
		.addIntegerOption(option => 
			option
				.setName('numresults')
				.setDescription("The number of players to show on the leaderboard, defaults to 10")
                .setRequired(false))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		let num = interaction.options.getInteger('numresults');
		if(num == null){
			num = 10;
		}
        if(num < 0){
            await interaction.reply("Number must be greater than 0");
            return;
        }
        leaderBoard(interaction,interaction.client,interaction.guildId,num);
	},
};
