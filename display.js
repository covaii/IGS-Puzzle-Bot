const {runBoard, GoBoardImageBuilder, sgfToCoords, wgoGridToImageStones, standardNotationToSGF, coordsToStandard } = require("./board.js");
const {getPuzzleAuthor,getPuzzleDiscription,getInitialStones} = require('./OGS.js');
const { getActivePuzzleID,getActiveServerName,getServerName,getScores } = require("./database.js");
const { EmbedBuilder,AttachmentBuilder,StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const Wgo = require("wgo");
const fs = require('fs');

async function runAndSendBoard(client,userID,stoneToAdd = "",showHelp = false,showPuzzleInfo = true){
    try{
        const user = await client.users.fetch(userID);

        const board = await runBoard(client,userID,stoneToAdd);

        if(board === "Invalid Move"){
            user.send("Invalid Move! Please Provide Valid Move");
            return;
        }

        const stones = await wgoGridToImageStones(board.grid);
        // console.log(board);

        let text = "";
        let feilds = [];

        if(showHelp){
            // text = text + "Use !Location to play a move (eg. !B17) \n" +
            // "Use !reset to reset puzzle to starting setup \n"
            feilds.push({name: "How To Use", value: "Use !Location to play a move (eg. !B17) \nUse !reset to reset puzzle to starting setup \n" +
                "Use !undo to undo last move"
            });
        }

        if(showPuzzleInfo){
            feilds.push(... await getPuzzleDetails(await getActivePuzzleID(client,userID)));
        }

        if(board.response_move != undefined){
            const loc = coordsToStandard(board.response_move.x,board.response_move.y);

            feilds.push({name: "Puzzle's Response", value: loc});
        }

        let notes = "";
        if(board.incorrect != undefined && board.incorrect == true){
            notes = notes + ":x: Incorrect! \n do !reset to start again";

        }else if(board.correct != undefined && board.correct == true){
            notes = notes + ":white_check_mark: Correct! \n";
        }

        if(board.text != undefined){
            notes = notes + board.text + "\n";
        }

        if(notes != ""){
            feilds.push({name:"Notes",value:notes});
        }


        const imageBuilder = new GoBoardImageBuilder(19);

        await imageBuilder.saveAsPNG(stones,userID + ".png");
        const file = new AttachmentBuilder(userID + ".png");

        const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(await getActiveServerName(client,userID) + "'s Puzzle")
        .addFields(feilds)
        .setImage("attachment://" + userID + ".png")
        .setTimestamp()

        await user.send({embeds: [embed], files: [file]});

        fs.unlink(userID + ".png", function (err){
            if (err) throw err;
        });
    }catch(error){
        console.log(error);
        // interaction.reply(error.message)
    }
}



async function showPuzzle(interaction,puzzleID="" ){
    const stones = await inititalStoneConverter(puzzleID);

    const board = new GoBoardImageBuilder(19);
    
    await board.saveAsPNG(stones,interaction.id + ".png");
    const file = new AttachmentBuilder(interaction.id + ".png");

    let feilds = [];
    feilds.push(... await getPuzzleDetails(puzzleID));

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle("Puzzle Id:" + puzzleID)
        .addFields(feilds)
        .setImage("attachment://" + interaction.id + ".png")
        .setTimestamp();

    await interaction.reply({embeds: [embed], files: [file]});
    
    fs.unlink(interaction.id + ".png", function (err){
        if (err) throw err;
    });
}


async function annoucePuzzle(client,guildID,channelID,role = ""){
    const puzzleID = await getActivePuzzleID(client,"",guildID);
    const stones = await inititalStoneConverter(puzzleID);

    const board = new GoBoardImageBuilder(19);
    
    await board.saveAsPNG(stones,guildID + ".png");
    const file = new AttachmentBuilder(guildID + ".png");

    let feilds = [];
    feilds.push(... await getPuzzleDetails(puzzleID));
    feilds.push({name:"How To Play",value:"Just type /play"})

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(await getServerName(client,guildID) + "'s Puzzle")
        .addFields(feilds)
        .setImage("attachment://" + guildID + ".png")
        .setTimestamp();

    let text = ""
    if(role == "" || role == undefined || role == null){
        await channelID.send({embeds: [embed], files: [file]});
    }else{
        text = `${role}`;
        await channelID.send({content: text, embeds: [embed], files: [file]});
    }


    
    
    fs.unlink(guildID + ".png", function (err){
        if (err) throw err;
    });
}



async function getPuzzleDetails(puzzleID) {
    let feilds = [];
    feilds.push({
        name:'Author',
        value: await getPuzzleAuthor(puzzleID) + "\n\n",
        inline: true
    });

    feilds.push({
        name: "Discription",
        value: await getPuzzleDiscription(puzzleID) + "\n\n",
        inline: true
    });
    return feilds;
}


async function inititalStoneConverter(puzzleID){
    const initalStones = await getInitialStones(puzzleID);

    stones = [];
    for (let i = 0; i < initalStones.whiteStonesInital.length; i = i + 2){
        const cords = sgfToCoords(initalStones.whiteStonesInital[i] + initalStones.whiteStonesInital[i+1]);
        stones.push({x: cords.x, y:cords.y , color: 'white'});
    }

    for (let i = 0; i < initalStones.blackStonesInital.length; i = i + 2){
        const cords = sgfToCoords(initalStones.blackStonesInital[i] + initalStones.blackStonesInital[i+1]);
        stones.push({x: cords.x, y:cords.y , color: 'black'});
    }

    return stones;
}

async function puzzleSelectorMenu(interaction,client,userID,inProgressPuzzles){
    //Want to allow the user to pick what puzzle to play if they have more than one
    if(inProgressPuzzles.length > 1){
        const menu = new StringSelectMenuBuilder()
        .setCustomId('puzzle_select')
        .addOptions(inProgressPuzzles.map(p => ({
            label: `Puzzle ${p.guildName}`,
            value: p.guildId
        })));

        const row = new ActionRowBuilder()
        .addComponents(menu);

        //send to DM
        const user = await interaction.client.users.fetch(interaction.user.id);
        await user.send({
            content: 'You have multiple in progress puzzles which would you like to do?',
            components: [row],
        });
    }
}

async function leaderBoard(interaction,client,guildID,numOfUsersToShow = 10) {
    const users = await getScores(client,guildID);

    for (user of users){
        user.name = await client.users.fetch(user.userId);
        user.name = user.name.username;
    }

    const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Leaderboard')
    .setDescription(
        users.sort((a, b) => b.score - a.score)
        .slice(0, numOfUsersToShow)
        .map((user, index) => `#${index + 1} ${user.name}: ${user.score}`)
        .join('\n')
    )

    interaction.reply({ embeds: [embed] });
}


module.exports = {
    runAndSendBoard,
    showPuzzle,
    annoucePuzzle,
    puzzleSelectorMenu,
    leaderBoard
}