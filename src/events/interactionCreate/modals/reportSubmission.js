const { EmbedBuilder } = require('discord.js');
const { guilds, colors, emojis } = require('../../../config.js');
const log = require('../../../utils/log.js');
const { sendReply } = require('../../../utils/sendReply.js');
const prisma = require('../../../utils/prismaClient.js');

async function reportSubmission(interaction, args) {
	await interaction.deferReply({ ephemeral: true });

	let guild = interaction.guild;

	let message;
	try {
		message = await interaction.channel.messages.fetch(args[2]);
	} catch (e) {
		message = false;
	}

	if (!message) {
		return sendReply(interaction, 'error', 'Message does not exist or could not retrieve message');
	}

	let mailChannel = await guild.channels.cache.get(guilds[interaction.guild.id].mailChannelID);

	let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;

	let mailStatus = args[3];

	let DMd;
	try {
		if (mailStatus === '1') {
			await interaction.user.send(
				`You have reported message: \`${message.content}\`\nThis DM channel will now act as a link between you and the server staff for 7 days so that we can collect more information and process your report. All messages sent here will be sent to your report.`
			);
		} else {
			await interaction.user.send(
				`You have reported message: \`${message.content}\`\nYou already have an active modmail, however, so DMs sent here will go to your already-open mod mail, as opposed to this specific report. Staff will contact you if they need more information from you.`
			);
		}
		DMd = true;
	} catch (e) {
		DMd = false;
	}

	let content = message.cleanContent || message.content;
	if (content.length > 1024) {
		content = `${content.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
	}

	let typedComments = false;
	try {
		typedComments = interaction.fields.getTextInputValue('reason');
	} catch (e) {
		// do nothing
	}

	let connectionMade = true;
	if (DMd === false) connectionMade = false;
	if (DMd === true && mailStatus === '0') connectionMade = false;

	let mailEmbed = new EmbedBuilder()
		.setTitle(`Message Report From ${interaction.user.username} (${interaction.user.id})`)
		.setColor(colors.main)
		.setDescription(`Message from <@${message.author.id}> reported`)
		.addFields({ name: 'Message Content', value: `\`${content}\`` })
		.addFields({ name: 'Channel', value: `<#${message.channel.id}>` })
		.addFields({ name: 'Message', value: `${message.url}` })
		.addFields({ name: 'Message Connection Opened With Reporter', value: `${connectionMade}` })
		.setAuthor({ name: interaction.user.username, iconURL: aviURL });

	if (typedComments) {
		mailEmbed.addFields({ name: 'Additional Comments From Reporter', value: typedComments });
	}

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
}

module.exports = { reportSubmission };
