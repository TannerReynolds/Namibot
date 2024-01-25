const { isStaff } = require('../../utils/isStaff');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const prisma = require('../../utils/prismaClient');
const { guilds, colors } = require('../../config.json');
const { getModChannels } = require('../../utils/getModChannels');
const log = require('../../utils/log');

const advertised = new Set();

function antiAds(message) {
	if (!message.channel.guild) return;
	if (message.author.bot) return;
	log.debug(`Checking message content for advertisements: ${message.content}`);
	if (!message.content.toLowerCase().includes('discord')) {
		return log.debug("Didn't include word Discord");
	}
	let regex = /discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+/gim;
	let sentInvite = message.content.match(regex);
	if (!sentInvite) {
		return log.debug(`didn't have an invite`);
	}
	if (isStaff(message, message.member, PermissionFlagsBits.ManageMessages)) {
		return log.debug(`invite detected, but staff sent it`);
	}

	let currentInvite = guilds[message.guild.id].invite.match(regex)[0];
	log.debug(`current invite: ${currentInvite}`);

	if (currentInvite === sentInvite[0] && !sentInvite[1]) {
		return log.debug(`No other invites and only invite sent was this server's`);
	}

	message.delete().catch(e => {
		log.error(`couldn't delete message: ${e}`);
	});

	message.author
		.send('You have been warned for sending a Discord invite link. Please do not send them before clearing it with staff. If you wish to partner with us, please DM the owners of the server')
		.catch(e => {
			log.debug(`Couldn't send message to author`);
		});

	message.member.timeout(60000 * 10, 'Invite Link Sent').catch(e => {
		log.error(`Couldn't time out member: ${e}`);
	});

	let logEmbed = new EmbedBuilder()
		.setColor(colors.main)
		.setTitle('Member Warned')
		.addFields({ name: 'User', value: `<@${message.author.id}> (${message.author.id})` }, { name: 'Reason', value: 'Discord invite link sent' }, { name: 'Moderator', value: `System` })
		.setTimestamp();

	getModChannels(message.client, message.guild.id)
		.main.send({
			embeds: [logEmbed],
			content: `<@${message.author.id}>`,
		})
		.catch(e => {
			log.error(`Couldn't log warning: ${e}`);
		});

	prisma.warning
		.create({
			data: {
				userID: message.author.id,
				date: new Date(),
				guildId: message.guild.id,
				reason: 'Discord invite link sent',
				moderator: `System`,
				type: 'WARN',
			},
		})
		.catch(e => {
			log.error(`couldn't add warning to database: ${e}`);
		});
}

module.exports = { antiAds };
