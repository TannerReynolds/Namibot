const { EmbedBuilder } = require('discord.js');
const { colors, emojis } = require('../../../config.js');
const log = require('../../../utils/log.js');
const { sendReply } = require('../../../utils/sendReply.js');
const prisma = require('../../../utils/prismaClient.js');
const { hasHigherPerms } = require('../../../utils/isStaff');
const { defineDuration, defineDurationString } = require('../../../utils/defineDuration');
const { getModChannels } = require('../../../utils/getModChannels');
const c = require('../../../config');

async function banSubmission(interaction, args) {
	await interaction.deferReply({ ephemeral: true });

	let target = args[1];

	let rawDuration = false;
	try {
		rawDuration = interaction.fields.getTextInputValue('duration');
	} catch (e) {
		return sendReply(interaction, 'error', 'Duration is required');
	}

	let reason = false;
	try {
		reason = interaction.fields.getTextInputValue('reason');
	} catch (e) {
		return sendReply(interaction, 'error', 'Reason is required');
	}

	let targetMember;
	try {
		targetMember = await interaction.guild.members.fetch(target);
	} catch (error) {
		if (error.message.toLowerCase().includes('unknown member')) {
			targetMember = false;
		} else {
			targetMember = false;
		}
	}

	if (targetMember) {
		let canDoAction = await hasHigherPerms(interaction.member, targetMember);
		if (!canDoAction) {
			return sendReply(interaction, 'error', `${emojis.error}  You or the bot does not have permissions to complete this action`);
		}
	}

	let duration = await defineDuration(interaction, rawDuration);
	let durationString = await defineDurationString(interaction, rawDuration);
	let banDate = new Date();

	if (targetMember) {
		await targetMember
			.send(
				`You have been banned from ${interaction.guild.name} for \`${reason}\`. The length of your ban is ${durationString}. If you want to appeal this ban, run the /appeal command and fill out the information! To run the /appeal command here in our DMs, you need to join the bot's server:\n${c.appealServer}`
			)
			.catch(() => {});
	}

	let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
	let name = interaction.user.username;

	try {
		interaction.guild.bans
			.create(target, {
				deleteMessageSeconds: 604800,
				reason: `${reason} | Duration: ${durationString} | Mod: ${interaction.user.username} (${interaction.user.id})`,
			})
			.catch(e => {
				log.error(`Error on banning user: ${target} | ${e}`);
				return sendReply(interaction, 'error', `${emojis.error}  Error banning member: ${e}`);
			});

		let banEmbed = new EmbedBuilder()
			.setTitle(`User Banned`)
			.setColor(colors.main)
			.setDescription(`${emojis.success}  Successfully banned <@${target}> for ${durationString}. Reason: ${reason}`)
			.setTimestamp()
			.setAuthor({ name: name, iconURL: aviURL });

		await interaction.channel.send({ embeds: [banEmbed] });
		sendReply(interaction, 'success', `${emojis.success}  Interaction Complete`);

		if (reason.length > 1024) {
			reason = `${reason.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
		}
		let logEmbed = new EmbedBuilder()
			.setColor(colors.main)
			.setTitle('Member Banned')
			.addFields(
				{ name: 'User', value: `<@${target}> (${target})` },
				{ name: 'Reason', value: reason },
				{ name: 'Ban Duration', value: durationString },
				{ name: 'Moderator', value: `${name} (${interaction.user.id})` }
			)
			.setAuthor({ name: name, iconURL: aviURL })
			.setTimestamp();

		if (targetMember) {
			logEmbed.setThumbnail(
				targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) ? targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) : targetMember.defaultAvatarURL
			);
		}

		getModChannels(interaction.client, interaction.guild.id)
			.main.send({
				embeds: [logEmbed],
				content: `<@${target}>`,
			})
			.catch(e => {
				log.error(`Could not send log message: ${e}`);
			});

		await prisma.ban
			.upsert({
				where: {
					userID_guildId: {
						userID: target,
						guildId: interaction.guild.id,
					},
				},
				update: {
					moderator: `${interaction.user.username} (${interaction.user.id})`,
					endDate: duration,
					reason: reason,
					startDate: banDate,
					duration: durationString,
				},
				create: {
					startDate: banDate,
					userID: target,
					guildId: interaction.guild.id,
					moderator: `${interaction.user.username} (${interaction.user.id})`,
					endDate: duration,
					reason: reason,
					duration: durationString,
				},
			})
			.catch(e => {
				log.error(`Error upserting ban record ${e}`);
			});
		await prisma.warning
			.create({
				data: {
					userID: target,
					date: banDate,
					guildId: interaction.guild.id,
					reason: reason,
					moderator: `${interaction.user.username} (${interaction.user.id})`,
					type: 'BAN',
				},
			})
			.catch(e => {
				log.error(`Error creating warning log: ${e}`);
			});
	} catch (e) {
		log.error(`Error banning user: ${e}`);
		return sendReply(interaction, 'error', `${emojis.error}  Error banning user: ${e}`);
	}
	log.debug('end');
}

module.exports = { banSubmission };
