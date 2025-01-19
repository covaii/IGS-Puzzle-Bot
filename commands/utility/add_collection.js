const { getPuzzleCollection } = require("../../OGS.js");
const { SlashCommandBuilder, Attachment, PermissionFlagsBits, InteractionContextType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add_collection')
		.setDescription('Adds a puzzle collection that will be used if the puzzle queue is empty')
        .addStringOption(option => 
			option
				.setName('collection')
				.setDescription("The name of the OGS collection to add")
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.ModerateMembers)
        .setContexts(InteractionContextType.Guild),
	async execute(interaction) {

        try{
            const response = await getPuzzleCollection(interaction.options.getString('collection'));
        }catch(error){
            await interaction.reply("Error getting collection, collection may be private");
            return;
        }

        if (response.data.count == 0){
            await interaction.reply("Error Finding Collection, Please Check the Name!");
            return;
        }

        if (response.data.count > 1){
            await interaction.reply("More than 1 collection found! Collection not added");
        }

        const clientdb = interaction.client.dbconn.db("Puzzle_Bot");
        const coll = clientdb.collection("servers");

        await coll.updateOne(
            {serverId : interaction.guild.id},
            {
                $push: {
                    approved_collections: response.data.results[0].id
                }
            }
        );

        await interaction.reply("Collection: " + interaction.options.getString('collection') + " Added!");
	},
};
