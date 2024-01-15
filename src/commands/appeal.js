const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors');
const { guilds } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('appeal')
		.setDescription('Send a request to have your ban appealed')
		.addStringOption(option =>
			option
				.setName('server')
				.setDescription('The server you were banned from')
				.setRequired(true)
				.addChoices({ name: 'The Car Community', value: '438650836512669699' }, { name: 'Learn Japanese', value: '1061175459112550490' })
		)
		.addStringOption(option => option.setName('reason').setDescription('The reason why you should be unbanned').setMaxLength(1_900).setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		let guildChoice = await interaction.options.getString('server');
		let reason = await interaction.options.getString('reason');
		let guild = interaction.client.guilds.cache.get(guildChoice);
		let blacklist = ['201718554620329984'];
		let blacklisted = blacklist.find(e => e === interaction.user.id);
		if (blacklisted) {
			return interaction.editReply('You have been blacklisted from appealing.');
		}

		let ban = await guild.bans.fetch(interaction.user.id);

		if (!ban) return interaction.editReply(`You are not banned from ${guild.name}`);

		let appealChannel = await guild.channels.cache.get(guilds[guildChoice].appealChannelID);

		let dbBan = await prisma.ban.delete({
			where: {
				userID_guildId: {
					userID: interaction.user.id,
					guildId: guildChoice,
				},
			},
		});

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');

		if (!dbBan) {
			let logEmbed = new EmbedBuilder()
				.setColor(colors.main)
				.setTitle('New Ban Appeal')
				.setDescription(`Why I should be unbanned: \`${reason}\``)
				.addFields({ name: 'Original Ban Reason', value: ban.reason })
				.setAuthor({ name: interaction.user.username, iconURL: aviURL })
				.setTimestamp();

			await appealChannel.send({
				embeds: [logEmbed],
				content: `<@${interaction.user.id}>`,
			});
			await interaction.editReply('Appeal sent!');
		} else {
			if (dbBan.endDate === new Date(2100, 0, 1)) dbBan.duration = 'Eternity';

			let logEmbed = new EmbedBuilder()
				.setColor(colors.main)
				.setTitle('New Ban Appeal')
				.setDescription(`Why I should be unbanned: \`${reason}\``)
				.addFields(
					{ name: 'User', value: dbBan.userID },
					{ name: 'Original Ban Reason', value: dbBan.reason },
					{ name: 'Ban Duration', value: dbBan.duration },
					{ name: 'Moderator', value: dbBan.moderator }
				)
				.setAuthor({ name: interaction.user.username, iconURL: aviURL })
				.setTimestamp();

			await appealChannel.send({
				embeds: [logEmbed],
				content: `<@${interaction.user.id}>`,
			});
			await interaction.editReply('Appeal sent!');
		}
	},
};
