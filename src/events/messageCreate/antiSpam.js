const state = require('../../utils/sharedState');
const { EmbedBuilder } = require('discord.js');
const { colors } = require('../../config.json');
const { getModChannels } = require('../../utils/getModChannels');
const log = require('../../utils/log');
const prisma = require('../../utils/prismaClient');

async function antiSpam(message) {
	const MAX_MENTIONS = 8;
	const MAX_NEWLINES = 65;
	const MAX_CHARS = 2000;

	const reasons = [];

	/*
	if (message.content.length >= MAX_CHARS) {
		await timeoutUser(message, 10);
		reasons.push('hitting the message character limit');
	}*/

	if (message.mentions.users.size + message.mentions.roles.size > MAX_MENTIONS) {
		await timeoutUser(message, 10);
		reasons.push('mass mentioning users or roles');
	}

	if (message.content.split('\n').length > MAX_NEWLINES) {
		await timeoutUser(message, 10);
		reasons.push('spamming new lines');
	}

	let rapidMessaging = await checkRapidMessaging(message);
	if (rapidMessaging) {
		await timeoutUser(message, 10);
		reasons.push('rapid messaging (over 3 messages in 1 second)');
	}

	if (reasons.length > 0) {
		let replyEmbed = new EmbedBuilder()
			.setTitle(`You have been automatically timed out for 10 minutes.`)
			.setColor(colors.success)
			.setDescription(`Reason: hitting the spam filter by ${reasons.join(', ')}`);
		message.reply({ embeds: [replyEmbed] }).then(r => {
			setTimeout(() => {
				log.debug(`deleting response`);
				return r.delete();
			}, 5000);
		})

		let aviURL = message.client.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			? message.client.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			: message.client.user.defaultAvatarURL;

		await prisma.warning
			.create({
				data: {
					userID: message.author.id,
					date: new Date(),
					guildId: message.guild.id,
					reason: `Hitting the spam filter by ${reasons.join(', ')}`,
					moderator: `System`,
					type: 'TIMEOUT',
				},
			})
			.catch(e => {
				log.error(`Error creating warning log: ${e}`);
			});

		let logEmbed = new EmbedBuilder()
			.setColor(colors.main)
			.setTitle('Member Timed Out Automatically')
			.addFields(
				{ name: 'User', value: `<@${message.author.id}> (${message.author.id})` },
				{ name: 'Reason', value: `Hitting the spam filter by ${reasons.join(', ')}` },
				{ name: 'Duration', value: '10 minutes' },
				{ name: 'Moderator', value: 'System' }
			)
			.setAuthor({ name: message.client.user.username, iconURL: aviURL })
			.setTimestamp();

		getModChannels(message.client, message.guild.id)
			.main.send({
				embeds: [logEmbed],
				content: `<@${message.author.id}>`,
			})
			.catch(e => {
				log.error(`Could not send log message: ${e}`);
			});
	}
}

async function timeoutUser(message, duration) {
	try {
		await message.member.timeout(duration * 60 * 1000, 'Spamming');
	} catch (error) {
		throw error;
	}
}

async function checkRapidMessaging(message) {
	const userID = message.author.id;
	const currentTimestamp = message.createdTimestamp;

	state.addMessageTimestamp(userID, currentTimestamp);

	const timestamps = state.getMessageTimestamps(userID);
	if (timestamps.length === 3) {
		const timeDiff = timestamps[2] - timestamps[0];
		const rapidTimeLimit = 1000;

		if (timeDiff <= rapidTimeLimit) {
			return true;
		}
	}
	return false;
}

module.exports = { antiSpam };
