const prisma = require('../../utils/prismaClient');
const { colors } = require('../../config.json');
const { EmbedBuilder } = require('discord.js');
const log = require('../../utils/log');

/**
 * Checks and unbans users whose bans have expired.
 * @param {Discord.Client} client - The Discord client object.
 * @param {Function} getModChannels - A function to get the moderation channels.
 * @returns {Promise<void>} - A promise that resolves once the check and unbanning process is complete.
 */
async function checkAndUnbanUsers(client, getModChannels) {
	try {
		let now = new Date();

		let expiredBans = await prisma.ban
			.findMany({
				where: {
					endDate: {
						lt: now,
					},
				},
			})
			.catch(() => {
				return log.error(`Couldn't get ban records`);
			});

		if (!expiredBans) return log.debug(`No expired bans`);

		for (let ban of expiredBans) {
			let guild = client.guilds.cache.get(ban.guildId);

			let aviURL = client.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
				? client.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
				: client.user.defaultAvatarURL;

			let isBanned = false;
			try {
				isBanned = await guild.bans.fetch(ban.userID);
			} catch (e) {
				return log.debug(`User is not banned`);
			}

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

			await prisma.ban
				.delete({
					where: {
						userID_guildId: {
							userID: ban.userID,
							guildId: ban.guildId,
						},
					},
				})
				.catch(() => {
					return log.error(`Couldn't delete ban record`);
				});

			guild.bans
				.remove(ban.userID)
				.then(() => {
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

					getModChannels(client, ban.guildId)
						.main.send({
							embeds: [logEmbed],
							content: `<@${ban.userID}>`,
						})
						.catch(e => {
							return log.error(`Couldn't send modlog: ${e}`);
						});
				})
				.catch(e => {
					return log.error(`Couldn't unban user: ${e}`);
				});
		}
	} catch (error) {
		return log.error('Failed to check and unban users:', error);
	}
}

module.exports = { checkAndUnbanUsers };
