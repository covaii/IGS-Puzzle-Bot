const { Events, MessageFlags } = require('discord.js');
const { runAndSendBoard } = require('../display.js')

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
			// console.log(interaction);

			if (interaction.customId === 'puzzle_select') {
				await interaction.update({ content: 'Puzzle Selected!', components: [] });
				const clientdb = interaction.client.dbconn.db("Puzzle_Bot");
				const userColl = clientdb.collection("users");

				await userColl.updateOne({ 
                    "userId" : interaction.user.id,
                    "guilds.guildId" : interaction.values[0]
                }, { $set : {
                    "guilds.$.active" : 1
                }});

				runAndSendBoard(interaction.client,interaction.user.id,"",true,true);
			}
		}
	},
};
