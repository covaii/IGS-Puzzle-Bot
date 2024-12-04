const { Events } = require('discord.js');
const {rundb , ensureAllServersExist} = require("../database.js");


module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client){
        console.log(`Ready! Logged in as ${client.user.tag}`);
  
        client.dbconn = await rundb();
  
        await ensureAllServersExist(client);
    },
};