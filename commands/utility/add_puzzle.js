const { getPuzzle } = require("../../OGS.js");
const { SlashCommandBuilder, Attachment, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add_puzzle')
		.setDescription('Adds Puzzle to the server queue')
        .addIntegerOption(option => 
			option
				.setName('id')
				.setDescription("ID of the puzzle to add to server queue")
                .setRequired(true))
        .addStringOption(option => 
            option
                .setName('position')
                .setDescription("Sets the position in the queue for the puzzle to go, defaults to End")
                .addChoices(
                    { name: 'Next', value: 'next' },
                    { name: 'Last', value: 'last' },)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.ModerateMembers),
	async execute(interaction) {
        id = interaction.options.getInteger('id');
                const position = interaction.options.getString('position');

        if(isNaN(id)){
            await interaction.reply("Id must be a number");
            return;
        }

        try{
            response = await getPuzzle(id);
        }catch(error){
            await interaction.reply("Error getting puzzle, puzzle may be private");
            return;
        }

        const clientdb = interaction.client.dbconn.db("Puzzle_Bot");
        const coll = clientdb.collection("servers");

        if (position === 'next') {
            // Add to beginning of queue
            await coll.updateOne(
                {serverId : interaction.guild.id},
                {
                    $push: {
                        puzzle_queue: {
                            $each: [id],
                            $position: 1  // Position 1 puts it after current puzzle
                        }
                    }
                }
            );
        } else {
            // Add to end of  defualt behavior
            await coll.updateOne(
                {serverId : interaction.guild.id},
                {
                    $push: {
                        puzzle_queue: id
                    }
                }
            );
        }

        await interaction.reply("Puzzle: " + id + " successfully added to queue!");
	},
};
