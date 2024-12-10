const { getPuzzle } = require("../../OGS.js");
const { SlashCommandBuilder, Attachment, PermissionFlagsBits } = require('discord.js');
const { annoucePuzzle } = require('../../display.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('announce_puzzle')
		.setDescription('Announces the puzzle on the given channel')
        .addChannelOption(option => 
			option
				.setName('channel')
				.setDescription("channel for the annoucment to go to")
                .setRequired(true))
        .addRoleOption(option => 
			option
				.setName('role')
				.setDescription("Role to ping about the annoucment"))
        
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.ModerateMembers),
	async execute(interaction) {
        annoucePuzzle(interaction.client,interaction.guild.id,interaction.options.getChannel('channel'),interaction.options.getRole('role'));

        await interaction.reply("Annocument Made");
	},
};
