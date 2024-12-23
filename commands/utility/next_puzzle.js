const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { resetPuzzle, moveQueue,getServerQueue, getServerApprovedCollections } = require("../../database.js")
const { getAllPuzzlesInCollection } = require("../../OGS.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('next_puzzle')
		.setDescription('Move the server to next puzzle in the queue. This will remove the current puzzle')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.ModerateMembers),
	async execute(interaction) {
        const queue = await getServerQueue(interaction.client,interaction.guildId);

        if(queue.length <= 1){
            const approvedCollections = await getServerApprovedCollections(interaction.client,interaction.guildId);
            if(approvedCollections.length == 0){
                await interaction.reply("Not another puzzle in queue! Please add one with /add_puzzle, Or add a back-up collection with" +
                    "/add_collection"
                );
                return;
            }
            

            collectionId = approvedCollections[Math.floor(Math.random() * approvedCollections.length)];
            const puzzles = await getAllPuzzlesInCollection(collectionId);

            const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];

            const clientdb = interaction.client.dbconn.db("Puzzle_Bot");
            const coll = clientdb.collection("servers");

            await coll.updateOne(
                {serverId : interaction.guild.id},
                {
                    $push: {
                        puzzle_queue: puzzle.id
                    }
                }
            );

            resetPuzzle(interaction.client,interaction.guild.id);

            //edge case
            if(queue.length >= 1){
                moveQueue(interaction.client,interaction.guild.id);
            }
            
            await interaction.reply("No puzzles in queue; using random approved collection!");
            return;
        }
        
        resetPuzzle(interaction.client,interaction.guild.id);
        moveQueue(interaction.client,interaction.guild.id);

        await interaction.reply("Server moved to next puzzle!");
	},
};
