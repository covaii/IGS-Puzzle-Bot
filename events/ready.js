const { Events } = require('discord.js');
const {rundb , ensureAllServersExist, nextPuzzle} = require("../database.js");
const schedule = require('node-schedule');
const {annoucePuzzle} = require("../display.js")


module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client){
        console.log(`Ready! Logged in as ${client.user.tag}`);
  
        client.dbconn = await rundb();
  
        await ensureAllServersExist(client);

        //schedule jobs
        const clientdb = client.dbconn.db("Puzzle_Bot");
        const serverColl = clientdb.collection("servers");

        const servers = await serverColl.find({}).toArray()

        for (server of servers){
            const guildId = server.serverId;
            const scheduleExpression = server.scheduleExpression;
            const channel = server.announcementChannel;
            const role = server.announcementRole;

            if(scheduleExpression == null || scheduleExpression == undefined || scheduleExpression == "")
                continue;

            // Create the scheduled job
            client.scheduledJobs = client.scheduledJobs || {};
            client.scheduledJobs[guildId] = schedule.scheduleJob(scheduleExpression, async () => {
                try{
                    await nextPuzzle(client,guildId);
                }catch(error){
                    console.error("Server: " + server.name + " Has no queue or approved collections at scheduled time");
                    return;
                }

                if (channel == "" || channel == undefined || channel == null){
                    return;
                }

                annoucePuzzle(client,guildId,channel,role);
            });

            console.log("Creating Schedule for " + server.name + " To Run at: " + scheduleExpression);
        }
    },
};