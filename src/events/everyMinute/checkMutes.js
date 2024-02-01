const prisma = require('../../utils/prismaClient');
const { EmbedBuilder } = require('discord.js');
const { guilds, colors } = require('../../config.json');
const log = require('../../utils/log');

/**
 * Checks and unmutes users whose mute duration has expired.
 * @param {Discord.Client} client - The Discord client object.
 * @param {Function} getModChannels - A function to get the moderation channels.
 * @returns {Promise<void>} - A promise that resolves once the check and unmute process is complete.
 */
async function checkAndUnmuteUsers(client, getModChannels) {
	try {
		let now = new Date();

		let expiredMutes = await prisma.mute
			.findMany({
				where: {
					endDate: {
						lt: now,
					},
				},
			})
			.catch(() => {
				log.debug(`Couldn't get expired mutes`);
			});

		if (!expiredMutes) return;

		for (let mute of expiredMutes) {
			let guild = client.guilds.cache.get(mute.guildId);
			let aviURL = client.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
				? client.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
				: client.user.defaultAvatarURL;

			await prisma.mute
				.delete({
					where: {
						userID_guildId: {
							userID: mute.userID,
							guildId: mute.guildId,
						},
					},
				})
				.catch(() => {
					log.error(`Couldn't delete mute record`);
				});

			let guildMember = false;
			try {
				guildMember = await guild.members.fetch(mute.userID);
			} catch (e) {
				return log.debug(`couldn't get guildMember object for muted member`);
			}

			guildMember.roles.remove(guilds[mute.guildId].muteRoleID).then(() => {
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

				getModChannels(client, mute.guildId)
					.main.send({
						embeds: [logEmbed],
						content: `<@${mute.userID}>`,
					})
					.catch(e => {
						return log.error(e);
					});
			});
		}
	} catch (error) {
		return log.error(`Failed to check and unmute users: ${error}`);
	}
}

module.exports = { checkAndUnmuteUsers };
