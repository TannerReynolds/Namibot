const { isStaff } = require('../../utils/isStaff');
const { PermissionFlagsBits } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const advertised = new Set();

function antiAds(message) {
	if (!message.content.toLowerCase().includes('discord')) {
		return;
	}
	let regex = /discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+/gim;
	if (!message.content.match(regex)) {
		return;
	}
	if (isStaff(message, message.member, PermissionFlagsBits.ManageMessages)) {
		return;
	}

	message.delete();

	message.author.send(
		'You have been warned for sending a Discord invite link. Please do not send them before clearing it with staff. If you wish to partner with us, please DM the owners of the server'
	);

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
