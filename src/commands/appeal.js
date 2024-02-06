const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prisma = require('../utils/prismaClient');
const { guilds, colors } = require('../config.json');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

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

		const existingMail = await prisma.mail.findFirst({
			where: {
				userID: interaction.user.id,
			},
		});

		if (existingMail) {
			return sendReply(interaction, 'error', 'You already have an active mod mail. Please wait for a response before creating another.');
		}

		log.debug(`Getting avatar URL...`);
		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		if (ban.reason.length > 1024) {
			ban.reason = `${ban.reason.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
		}
		let logEmbed;
		if (!dbBan) {
			log.debug('No ban found...');
			logEmbed = new EmbedBuilder()
				.setColor(colors.main)
				.setTitle('New Ban Appeal')
				.setDescription(`Why I should be unbanned: \`${reason}\``)
				.addFields({ name: 'Original Ban Reason', value: ban.reason || 'N/A' })
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
				let wipeDate = new Date();
				wipeDate.setDate(wipeDate.getDate() + 3);
				prisma.mail
					.create({
						data: {
							userID: interaction.user.id,
							guildId: guildChoice,
							postID: forumPost.id,
							date: wipeDate,
						},
					})
					.then(() => {
						return sendReply(interaction, 'main', 'Appeal Sent!');
					})
					.catch(e => {
						log.error(`Error creating appeal: ${e}`);
						return sendReply(interaction, 'error', `Error creating appeal: ${e}`);
					});
			})
			.catch(e => {
				log.error(`Error creating thread: ${e}`);
				return sendReply(interaction, 'error', `Error creating thread: ${e}`);
			});
	},
};
