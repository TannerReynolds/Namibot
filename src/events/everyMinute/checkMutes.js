const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const colors = require('../../utils/embedColors');
const { EmbedBuilder } = require('discord.js');
const { guilds } = require('../../config.json');

async function checkAndUnmuteUsers(client, getModChannels) {
	try {
		let now = new Date();

		let expiredMutes = await prisma.mute.findMany({
			where: {
				endDate: {
					lt: now,
				},
			},
		});

		if (!expiredMutes) return;

		for (let mute of expiredMutes) {
			let guild = client.guilds.cache.get(mute.guildId);

			let aviURL = client.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');

			await prisma.mute.delete({
				where: {
					userID_guildId: {
						userID: mute.userID,
						guildId: mute.guildId,
					},
				},
			});

			let guildMember = await guild.members.fetch(mute.userID);

			guildMember.roles.remove(guilds[mute.guildId].muteRoleID).then(user => {
				let logEmbed = new EmbedBuilder()
					.setColor(colors.main)
					.setTitle('Member Unmuted')
					.addFields(
						{ name: 'User', value: mute.userID },
						{ name: 'Original Mute Reason', value: mute.reason },
						{ name: 'Mute Duration', value: mute.duration },
						{ name: 'Unmute Reason', value: 'Timed Mute Expired' }
					)
					.setAuthor({ name: client.user.username, iconURL: aviURL })
					.setTimestamp();

				getModChannels(client, mute.guildId).main.send({
					embeds: [logEmbed],
					content: `<@${mute.userID}>`,
				});
			});
		}
	} catch (error) {
		console.error('Failed to check and unmute users:', error);
	}
}

module.exports = { checkAndUnmuteUsers };
