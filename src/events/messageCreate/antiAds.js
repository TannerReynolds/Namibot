const { isStaff } = require('../../utils/isStaff');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { guilds } = require('../../config.json');
const colors = require('../../utils/embedColors');
const { getModChannels } = require('../../utils/getModChannels');

const advertised = new Set();

function antiAds(message) {
	if (!message.channel.guild) return;
	if (!message.content.toLowerCase().includes('discord')) {
		return;
	}
	let regex = /discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+/gim;
	let sentInvite = message.content.match(regex);
	if (!sentInvite) {
		return;
	}
	if (isStaff(message, message.member, PermissionFlagsBits.ManageMessages)) {
		return;
	}

	let currentInvite = guilds[message.guild.id].invite.match(regex)[0];

	if (currentInvite === sentInvite[0] && !sentInvite[1]) {
		return;
	}

	message.delete();

	message.author.send(
		'You have been warned for sending a Discord invite link. Please do not send them before clearing it with staff. If you wish to partner with us, please DM the owners of the server'
	);

	message.member.timeout(60000 * 10, 'Invite Link Sent');

	let logEmbed = new EmbedBuilder()
		.setColor(colors.main)
		.setTitle('Member Warned')
		.addFields({ name: 'User', value: `<@${message.author.id}> (${message.author.id})` }, { name: 'Reason', value: 'Discord invite link sent' }, { name: 'Moderator', value: `System` })
		.setTimestamp();

	getModChannels(message.client, message.guild.id).main.send({
		embeds: [logEmbed],
		content: `<@${message.author.id}>`,
	});

	prisma.warning.create({
		data: {
			userID: message.author.id,
			date: new Date(),
			guildId: message.guild.id,
			reason: 'Discord invite link sent',
			moderator: `System`,
			type: 'WARN',
		},
	});
}

module.exports = { antiAds };
