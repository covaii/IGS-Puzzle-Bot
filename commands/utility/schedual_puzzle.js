const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const schedule = require('node-schedule');
const {annoucePuzzle} = require("../../display.js")
const { getServerQueue, resetPuzzle, moveQueue } = require("../../database.js");
const { getServerApprovedCollections, getAllPuzzlesInCollection } = require("../../OGS.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule_puzzle')
        .setDescription('Schedule automatic puzzle advancement')
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('Schedule puzzles to advance daily at midnight')
                .addChannelOption(option => 
                    option
                        .setName('channel')
                        .setDescription('Channel for the announcement (if left blank, no announcement will be made)')
                        .setRequired(false))
                .addRoleOption(option => 
                    option
                        .setName('role')
                        .setDescription('Role to ping about the announcement')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('weekly')
                .setDescription('Schedule puzzles to advance weekly on Sunday')
                .addChannelOption(option => 
                    option
                        .setName('channel')
                        .setDescription('Channel for the announcement (if left blank, no announcement will be made)')
                        .setRequired(false))
                .addRoleOption(option => 
                    option
                        .setName('role')
                        .setDescription('Role to ping about the announcement')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('custom')
                .setDescription('Set a custom schedule using cron expression')
                .addStringOption(option =>
                    option
                        .setName('cron')
                        .setDescription('Cron expression (e.g., "0 0 * * *" for daily at midnight)')
                        .setRequired(true))
                .addChannelOption(option => 
                    option
                        .setName('channel')
                        .setDescription('Channel for the announcement (if left blank, no announcement will be made)')
                        .setRequired(false))
                .addRoleOption(option => 
                    option
                        .setName('role')
                        .setDescription('Role to ping about the announcement')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('off')
                .setDescription('Turn off scheduled advancement'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');

        // Get the database connection
        const clientdb = interaction.client.dbconn.db("Puzzle_Bot");
        const serverColl = clientdb.collection("servers");

        // Cancel existing job if it exists
        if (interaction.client.scheduledJobs?.[guildId]) {
            interaction.client.scheduledJobs[guildId].cancel();
        }

        let cronExpression;
        let scheduleDescription;

        switch (subcommand) {
            case 'daily':
                cronExpression = '0 0 * * *'; // Every day at midnight
                scheduleDescription = 'daily at midnight';
                break;
            case 'weekly':
                cronExpression = '0 0 * * 0'; // Every Sunday at midnight
                scheduleDescription = 'weekly on Sunday at midnight';
                break;
            case 'custom':
                const customCron = interaction.options.getString('cron');
                try {
                    // Validate the cron expression by attempting to schedule a job
                    schedule.scheduleJob(customCron, () => {});
                    cronExpression = customCron;
                    scheduleDescription = `custom schedule: ${customCron}`;
                } catch (error) {
                    await interaction.reply({
                        content: 'Error: Invalid cron expression. Please use valid cron syntax.',
                        ephemeral: true
                    });
                    return;
                }
                break;
            case 'off':
                // Update database to remove scheduling
                await serverColl.updateOne(
                    { serverId: guildId },
                    { 
                        $unset: { 
                            scheduleExpression: "",
                            announcementChannel: "",
                            announcementRole: ""
                        } 
                    }
                );
                await interaction.reply('Puzzle advancement scheduling has been turned off.');
                return;
        }

        if (cronExpression) {
            // Save the schedule and announcement settings to the database
            const updateDoc = {
                scheduleExpression: cronExpression
            };

            if (channel) {
                updateDoc.announcementChannel = channel.id;
            }
            if (role) {
                updateDoc.announcementRole = role.id;
            }

            await serverColl.updateOne(
                { serverId: guildId },
                { $set: updateDoc }
            );

        }

        // Create the scheduled job
        interaction.client.scheduledJobs = interaction.client.scheduledJobs || {};
        interaction.client.scheduledJobs[guildId] = schedule.scheduleJob(cronExpression, async () => {

            //next puzzle code
            const queue = await getServerQueue(interaction.client,interaction.guildId);

            if(queue.length <= 1){
                const approvedCollections = await getServerApprovedCollections(interaction.client,interaction.guildId);
                if(approvedCollections.length == 0){
                    console.error("No puzzle in queue and no backup collections");
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
                return;
            }
            
            resetPuzzle(interaction.client,interaction.guild.id);
            moveQueue(interaction.client,interaction.guild.id);

            //annoucment Code
            

            annoucePuzzle()

        })

        console.log(interaction.client.scheduledJobs);
        await interaction.reply("test");
    },
};