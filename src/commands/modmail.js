const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prisma = require('../utils/prismaClient');
const { guilds, colors } = require('../config.json');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('modmail')
		.setDescription('Open a conversation channel in your DMs with the staff of a server (Connection lasts 3 days)')
		.addStringOption(option => {
			option.setName('server').setDescription(`The server who's staff you want to contact`).setRequired(true);
			for (const guildId in guilds) {
				const guild = guilds[guildId];
				option.addChoices({ name: guild.name, value: guildId });
			}
			return option;
		})
		.addStringOption(option => option.setName('message').setDescription('What you would like to talk to staff members about').setMaxLength(1_900).setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		let guildChoice = await interaction.options.getString('server');
		let message = await interaction.options.getString('message');
		let guild = interaction.client.guilds.cache.get(guildChoice);
		log.debug(`Getting guild name: ${guild.name}`);

		const existingMail = await prisma.mail.findFirst({
			where: {
				userID: interaction.user.id,
			},
		});

		if (existingMail) {
			return sendReply('error', 'You already have an active mod mail. Please wait for a response before creating another.');
		}

		log.debug(`Getting debug channel...`);
		let mailChannel = await guild.channels.cache.get(guilds[guildChoice].mailChannelID);

		log.debug(`Getting avatar URL...`);
		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;

		let mailEmbed = new EmbedBuilder()
			.setTitle(`Mod Mail From ${interaction.user.username} (${interaction.user.id})`)
			.setColor(colors.main)
			.setDescription(`\`${message}\``)
			.setAuthor({ name: interaction.user.username, iconURL: aviURL });

		mailChannel.threads
			.create({
				name: `Mod Mail From ${interaction.user.username}`,
				reason: `Mod Mail From ${interaction.user.username} (${interaction.user.id})`,
				message: { embeds: [mailEmbed], content: `<@${interaction.user.id}>` },
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
					.then(r => {
						return sendReply(
							'main',
							'Mod Mail Sent! This channel connection will be deleted in 3 days, or when a staff member locks/closes the thread. No need to run any commands to respond. All messages sent in this DM will be sent to the staff of the server until the connection is closed.'
						);
					})
					.catch(e => {
						log.error(`Error creating mod mail: ${e}`);
						return sendReply('error', `Error creating mod mail: ${e}`);
					});
			})
			.catch(e => {
				log.error(`Error creating thread: ${e}`);
				return sendReply('error', `Error creating thread: ${e}`);
			});
	},
};
