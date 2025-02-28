const { getPuzzleCollection,getPuzzleCollectionNamefromID } = require("../../OGS.js");
const { SlashCommandBuilder, Attachment, PermissionFlagsBits, InteractionContextType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('collection')
		.setDescription('Puzzle Collection Commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('add a OGS collection to appoved collection lists')
                .addStringOption(option => 
                    option
                        .setName('collection')
                        .setDescription("The name of the OGS collection to add")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription("List all approved puzzle collections"))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription("Remove a puzzle collection")
                .addStringOption(option => 
                    option
                        .setName('collection')
                        .setDescription("The name of the OGS collection to remove")
                        .setRequired(true)))   
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.ModerateMembers)
        .setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const collectionName = interaction.options.getString('collection');

        const clientdb = interaction.client.dbconn.db("Puzzle_Bot");
        const coll = clientdb.collection("servers");

        switch(subcommand){
            case 'add':
                let id = await checkName(interaction,collectionName);
                
                await coll.updateOne(
                    {serverId : interaction.guild.id},
                    {
                        $push: {
                            approved_collections: response.data.results[0].id
                        }
                    }
                );
                await interaction.reply("Collection: " + collectionName + " Added!");
                break;

            case 'list':
                let collections = await coll.find({
                    "serverId": interaction.guildId
                }).toArray();

                collections = await collections[0].approved_collections
                console.log(collections);

                if(collections.length == 0){
                    await interaction.reply("No approved collections!");
                    return;
                }
                let reply = "";
                for(collId of collections){
                    reply = reply + await getPuzzleCollectionNamefromID(collId) + "\n";
                }
                interaction.reply(reply);
                break;
            case 'remove':
                interaction.reply("TODO");
        }

    },
};

async function checkName(interaction,name){
    try{
        const response = await getPuzzleCollection(name);
    }catch(error){
        await interaction.reply("Error getting collection, collection may be private");
        return;
    }

    if (response.data.count == 0){
        await interaction.reply("Error Finding Collection, Please Check the Name!");
        return;
    }

    if (response.data.count > 1){
        await interaction.reply("More than 1 collection found! Please verify name");
    }

    return response.data.results[0].id;
}