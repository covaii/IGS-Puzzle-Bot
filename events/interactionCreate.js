const { Events, MessageFlags } = require('discord.js');
const { runBoard } = require("../board.js");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()){

			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				}
			}
		}else if(interaction.isSelectMenu){
			console.log(interaction);

			if (interaction.customId === 'puzzle_select') {
				await interaction.update({ content: 'Puzzle Selected!', components: [] });
				//TODO: set active puzzle
				


				// try{
				// 	const board = await runBoard(interaction.client,interaction.user.id);

				// 	const stones = wgoGridToImageStones(board.grid);
				// 	console.log(board);
				// 	const imageBuilder = new GoBoardImageBuilder(19);
		
				// 	const user = await interaction.client.users.fetch(interaction.user.id);
		
				// 	await imageBuilder.saveAsPNG(stones,interaction.id + ".png");
				// 	await user.send({files : [{attachment: interaction.id + ".png"}] });
			
				// 	fs.unlink(interaction.id + ".png", function (err){
				// 		if (err) throw err;
				// 	});
				// 	}catch(error){
				// 		console.log(error);
				// 		// interaction.reply(error.message)
				// }

				
			}
		}
	},
};
