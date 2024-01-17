const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const colors = require('../../utils/embedColors');
const { EmbedBuilder } = require('discord.js');
const log = require('../../utils/log');

async function checkAndUnbanUsers(client, getModChannels) {
	try {
		let now = new Date();

		let expiredBans = await prisma.ban.findMany({
			where: {
				endDate: {
					lt: now,
				},
			},
		});

		if (!expiredBans) return;

		for (let ban of expiredBans) {
			let guild = client.guilds.cache.get(ban.guildId);

			let aviURL = client.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 });

			isBanned = await guild.bans.fetch(ban.userID);

			if (!isBanned) {
				await prisma.ban.delete({
					where: {
						userID_guildId: {
							userID: ban.userID,
							guildId: ban.guildId,
						},
					},
				});
				return;
			}

			await prisma.ban.delete({
				where: {
					userID_guildId: {
						userID: ban.userID,
						guildId: ban.guildId,
					},
				},
			});

			guild.bans.remove(ban.userID).then(user => {
				let logEmbed = new EmbedBuilder()
					.setColor(colors.main)
					.setTitle('Member Unbanned')
					.addFields(
						{ name: 'User', value: ban.userID },
						{ name: 'Original Ban Reason', value: ban.reason },
						{ name: 'Ban Duration', value: ban.duration },
						{ name: 'Unban Reason', value: 'Timed Ban Expired' }
					)
					.setAuthor({ name: client.user.username, iconURL: aviURL })
					.setTimestamp();

				getModChannels(client, ban.guildId).main.send({
					embeds: [logEmbed],
					content: `<@${ban.userID}>`,
				});
			});
		}
	} catch (error) {
		log.error('Failed to check and unban users:', error);
	}
}

module.exports = { checkAndUnbanUsers };
