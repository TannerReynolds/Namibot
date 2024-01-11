const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
	data: new SlashCommandBuilder().setName('test').setDescription('test').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		await interaction.deferReply();
		// Get current date and time
		let now = new Date();
		console.log(`DATE: ${now}`);

		// Find all bans where endDate has passed
		let expiredBans = await prisma.ban.findMany({
			where: {
				endDate: {
					lt: now,
				},
			},
		});

		if (!expiredBans) return console.log('no expired bans');

		for (let ban of expiredBans) {
			console.log(`Found ban: ${ban}\n\n\n`);
			await prisma.ban.delete({
				where: {
					userID_guildId: {
						userID: ban.userID,
						guildId: ban.guildId,
					},
				},
			});
			console.log(`Completed Delete Operation`);
		}
		interaction.editReply('done');
	},
};
