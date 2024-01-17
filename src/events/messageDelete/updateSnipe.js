const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const log = require('../../utils/log');

async function updateSnipe(message) {
	let guildMember = await message.guild.members.fetch(message.author.id);
	let aviURL = await guildMember.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 });

	try {
		// Check if the channel exists
		let channel = await prisma.channel.findUnique({
			where: { id: message.channel.id },
		});

		// If channel does not exist, create it
		if (!channel) {
			channel = await prisma.channel.create({
				data: { id: message.channel.id },
			});
		}

		// Check if a snipe exists for the channel
		let snipe = channel.snipeId
			? await prisma.snipe.findUnique({
					where: { id: channel.snipeId },
			  })
			: null;

		// If a snipe exists, update it; if not, create a new snipe
		if (snipe) {
			await prisma.snipe.update({
				where: { id: snipe.id },
				data: {
					memberPfp: aviURL,
					memberName: guildMember.user.username,
					memberMessage: message.content,
				},
			});
		} else {
			snipe = await prisma.snipe.create({
				data: {
					memberPfp: aviURL,
					memberName: guildMember.user.username,
					memberMessage: message.content,
					Channel: { connect: { id: message.channel.id } },
				},
			});

			// Update channel with the new snipe ID
			await prisma.channel.update({
				where: { id: message.channel.id },
				data: { snipeId: snipe.id },
			});
		}
	} catch (error) {
		console.error('Error in createOrUpdateSnipe:', error);
	}
}

module.exports = { updateSnipe };
