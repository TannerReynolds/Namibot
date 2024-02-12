const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { guilds, colors, emojis } = require('../config');
const log = require('../utils/log.js');
const { sendReply } = require('../utils/sendReply');
const prisma = require('../utils/prismaClient');

module.exports = {
	data: new ContextMenuCommandBuilder().setName('Report Message').setDMPermission(false).setType(ApplicationCommandType.Message),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		if (!guilds[interaction.guild.id].features.modMail) {
			return sendReply(interaction, 'error', `${emojis.error}  This server does not have mod mail enabled`);
		}
		log.debug(`Getting Target...`);
		let targetMessage = interaction.targetMessage || false;
		if (targetMessage === undefined || !targetMessage) {
			log.debug(`Target undefined`);
			return sendReply(interaction, 'error', `${emojis.error}  This message does not exist`);
		}

		let message = targetMessage;
		let guild = interaction.guild;

		const existingMail = await prisma.mail.findFirst({
			where: {
				userID: interaction.user.id,
			},
		});

		if (existingMail) {
			return sendReply(interaction, 'error', `${emojis.error}  You already have an active mod mail. Please wait for a response before creating another.`);
		}

		log.debug(`Getting debug channel...`);
		let mailChannel = await guild.channels.cache.get(guilds[interaction.guild.id].mailChannelID);

		log.debug(`Getting avatar URL...`);
		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;

		let DMd;
		try {
			await interaction.user.send(
				`You have reported message: \`${message.content}\`\nThis DM channel will now act as a link between you and the server staff for 7 days so that we can collect more information and process your report. All messages sent here will be sent to your report.`
			);
			DMd = true;
		} catch (e) {
			DMd = false;
		}

		let content = message.cleanContent || message.content;
		if (content.length > 1024) {
			content = `${content.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
		}

		let mailEmbed = new EmbedBuilder()
			.setTitle(`Message Report From ${interaction.user.username} (${interaction.user.id})`)
			.setColor(colors.main)
			.setDescription(`Message from <@${message.author.id}> reported`)
			.addFields({ name: 'Message Content', value: `\`${content}\`` })
			.setAuthor({ name: interaction.user.username, iconURL: aviURL });

		mailChannel.threads
			.create({
				name: `Message Report From ${interaction.user.username}`,
				reason: `Message Report From ${interaction.user.username} (${interaction.user.id})`,
				message: { embeds: [mailEmbed], content: `Creator: <@${interaction.user.id}> | Member Reported: <@${message.author.id}>` },
			})
			.then(forumPost => {
				let wipeDate = new Date();
				wipeDate.setDate(wipeDate.getDate() + 7);
				prisma.mail
					.create({
						data: {
							userID: interaction.user.id,
							guildId: interaction.guild.id,
							postID: forumPost.id,
							date: wipeDate,
						},
					})
					.then(() => {
						if (DMd) {
							return sendReply(interaction, 'main', `${emojis.success}  Report Sent! See your DMs for more information!`);
						} else {
							return sendReply(
								interaction,
								'main',
								`${emojis.success}  Report Sent! Your DMs are closed, so the staff members cannot start a communication line with your in your report channel. Please look out for friend requests from staff members.`
							);
						}
					})
					.catch(e => {
						log.error(`Error creating mod mail: ${e}`);
						return sendReply(interaction, 'error', `${emojis.error}  Error creating mod mail: ${e}`);
					});
			})
			.catch(e => {
				log.error(`Error creating thread: ${e}`);
				return sendReply(interaction, 'error', `${emojis.error}  Error creating thread: ${e}`);
			});
	},
};
