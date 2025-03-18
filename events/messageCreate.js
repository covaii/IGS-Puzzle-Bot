const { Client, Events, GatewayIntentBits } = require('discord.js');
const { standardNotationToSGF, runBoard, wgoGridToImageStones,GoBoardImageBuilder } = require('../board.js');
const { resetUserActiveMoves,removeLastUserStone,getActivePuzzleID, getInProgessPuzzles } = require("../database.js");
const { runAndSendBoard, puzzleSelectorMenu } = require("../display.js");

module.exports = {
    name: Events.MessageCreate,
    intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
    once: false,
    async execute(message) {
        if (!message.guild) {
            if(message.author.id == "1313256722659541052")//this the bot
                return;

            // Handle DM logic here
            // console.log(`Received DM from ${message.author.tag}: ${message.content}`);
            if(message.content[0] == '!'){

                //make sure they have an active puzzles
                const puzzle = await getActivePuzzleID(message.client,message.author.id);
                if(puzzle == undefined || puzzle == null){

                    const inProgressPuzzles = await getInProgessPuzzles(message.client,message.author.id)
                    if(inProgressPuzzles.length > 1){
                        //set all puzzles to inactive so they can select with the puzzle selector menu
                        userColl.updateMany({ 
                            "userId" : interaction.user.id,
                        }, { $set : {
                            "guilds.active" : 0
                        }});


                        await puzzleSelectorMenu(message,message.client,message.author.id,inProgressPuzzles);
                        return;
                    }else if(inProgressPuzzles.length == 0){
                        await message.reply("You have no in-progress puzzles, please go on a server and do /play to add one");
                        return;
                    }else if(inProgressPuzzles.length == 1){
                        await userColl.updateOne({ 
                            "userId" : message.user.id,
                            "guilds.guildId" : message.guildId
                        }, { $set : {
                            "guilds.$.in_progress" : 1,
                            "guilds.$.active" : 1
                        }});
                    }
                }
                

                //move
                if(message.content.toUpperCase() === "!RESET"){
                    await resetUserActiveMoves(message.client,message.author.id);

                    runAndSendBoard(message.client,message.author.id);
                }else if(message.content.toUpperCase() === "!UNDO"){
                    await removeLastUserStone(message.client,message.author.id);

                    runAndSendBoard(message.client,message.author.id);
                }else{

                    // const SGF = await standardNotationToSGF(message.content.trim().slice(1));

                    runAndSendBoard(message.client,message.author.id,message.content.trim().slice(1));
                }
            }
        }
    }
};