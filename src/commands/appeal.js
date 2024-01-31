const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const prisma = require('../utils/prismaClient');
const { guilds, colors } = require('../config.json');
const log = require('../utils/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('appeal')
		.setDescription('Send a request to have your ban appealed')
		.addStringOption(option => {
			option.setName('server').setDescription('The server you were banned from').setRequired(true);
			for (const guildId in guilds) {
				const guild = guilds[guildId];
				option.addChoices({ name: guild.name, value: guildId });
			}
			return option;
		})
		.addStringOption(option => option.setName('reason').setDescription('The reason why you should be unbanned').setMaxLength(1_900).setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		let guildChoice = await interaction.options.getString('server');
		let reason = await interaction.options.getString('reason');
		let guild = interaction.client.guilds.cache.get(guildChoice);
		log.debug(`Getting guild name: ${guild.name}`);
		let blacklist = ['201718554620329984'];
		let blacklisted = blacklist.find(e => e === interaction.user.id);
		if (blacklisted) {
			log.debug(`User blacklisted user ID: ${interaction.user.id}`);
			return interaction.editReply('You have been blacklisted from appealing.');
		}

		log.debug(`Looking for guild ban...`);
		let ban = false;
		try {
			ban = await guild.bans.fetch(interaction.user.id);
		} catch (e) {
			log.debug(`User is not banned from guild: ${e}`);
		}

		if (!ban) {
			log.debug(`Did not find ban in ${guild.name} for ${interaction.user.username}`);
			return interaction.editReply(`You are not banned from ${guild.name}`);
		}

		log.debug(`Getting debug channel...`);
		let mailChannel = await guild.channels.cache.get(guilds[guildChoice].mailChannelID);

		let dbBan = await prisma.ban
			.findUnique({
				where: {
					userID_guildId: {
						userID: interaction.user.id,
						guildId: guildChoice,
					},
				},
			})
			.catch(e => {
				log.error(`Error fetching ban: ${e}`);
			});

		log.debug(`Getting avatar URL...`);
		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;

		let logEmbed;
		if (!dbBan) {
			log.debug('No ban found...');
			logEmbed = new EmbedBuilder()
				.setColor(colors.main)
				.setTitle('New Ban Appeal')
				.setDescription(`Why I should be unbanned: \`${reason}\``)
				.addFields({ name: 'Original Ban Reason', value: ban.reason })
				.setAuthor({ name: interaction.user.username, iconURL: aviURL })
				.setTimestamp();
		} else {
			log.debug('Ban found');
			if (dbBan.endDate === new Date(2100, 0, 1)) dbBan.duration = 'Eternity';

			logEmbed = new EmbedBuilder()
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
		}

		mailChannel.threads
			.create({
				name: `Ban Appeal From ${interaction.user.username}`,
				reason: `Ban Appeal From ${interaction.user.username} (${interaction.user.id})`,
				message: { embeds: [logEmbed], content: `<@${interaction.user.id}>` },
			})
			.then(forumPost => {
				prisma.mail
					.create({
						data: {
							userID: interaction.user.id,
							guildId: interaction.guild.id,
							postID: forumPost.id,
						},
					})
					.then(r => {
						return sendReply('main', 'Appeal Sent!');
					})
					.catch(e => {
						log.error(`Error creating appeal: ${e}`);
						return sendReply('error', `Error creating appeal: ${e}`);
					});
			})
			.catch(e => {
				log.error(`Error creating thread: ${e}`);
				return sendReply('error', `Error creating thread: ${e}`);
			});

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};
