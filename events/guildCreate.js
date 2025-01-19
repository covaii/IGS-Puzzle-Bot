const { Events } = require('discord.js');
const {ensureAllServersExist} = require("../database.js");

module.exports = {
    name: Events.GuildCreate,
    once: false,
    async execute(guild){
        console.log(`Bot joined a new server: ${guild.name} (ID: ${guild.id})`);

        const database = guild.client.dbconn.db('Puzzle_Bot');
        const serversCollection = database.collection('servers');

        //check just incase we dont want to override anything
        const existingServer = await serversCollection.findOne({ serverId: guild.id });

        if (!existingServer) {
            await serversCollection.insertOne({
                'serverId' : guild.id,
                'name' : guild.name,  
                'puzzle_queue' : [],
                'approved_collections': []
            });
        }
    }
}
