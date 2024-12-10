const { SlashCommandBuilder, userMention, StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');
const { runBoard, wgoGridToImageStones, GoBoardImageBuilder } = require("../../board.js");
const { runAndSendBoard, puzzleSelectorMenu } = require("../../display.js");
const {getInProgessPuzzles} = require("../../database.js");


module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Allows you to play this puzzle'),
	async execute(interaction) {
        const clientdb = interaction.client.dbconn.db("Puzzle_Bot");
        const userColl = clientdb.collection("users");

        // Check if user already has the server in their list
        const find = await userColl.find(
            {
                "userId" : interaction.user.id,
                "guilds.guildId" : interaction.guildId
            }).toArray();

        //add server to list if they dont have it already
        if(find.length == 0){
            await userColl.updateOne(
                { 
                    userId: interaction.user.id,
                },
                {
                    $push : {
                        guilds: {
                            guildId: interaction.guildId,
                            score : 0,
                            active_moves: [],
                            tries: 0,
                            active: 0,
                            in_progress: 1,
                            solved: false
                        }
                    }
                },
                { upsert: true }
            );
        }else{
            //set the server to inprogress
            await userColl.updateOne(
                { 
                    userId: interaction.user.id,
                    "guilds.guildId" : interaction.guildId
                },
                {
                    $set : {
                        "guilds.$.in_progress" : 1
                    }
                });
        }
        
        const inProgressPuzzles = await getInProgessPuzzles(interaction.client,interaction.user.id);
        console.log(inProgressPuzzles);
        if(inProgressPuzzles.length > 1){
            await puzzleSelectorMenu(interaction,interaction.client,interaction.user.id,inProgressPuzzles);
            await interaction.reply({content: "Check direct message from the bot" ,flags : MessageFlags.Ephemeral});
            //TODO: Set all puzzles as not active
            return;
        }else{
            await userColl.updateOne({ 
                    "userId" : interaction.user.id,
                    "guilds.guildId" : interaction.guildId
                }, { $set : {
                    "guilds.$.active" : 1
                }});

            await interaction.reply({content: "Check direct message from the bot" ,flags : MessageFlags.Ephemeral});


            runAndSendBoard(interaction.client,interaction.user.id,"",true,true);

        }


	},
};
