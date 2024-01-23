const log = require('../../utils/log');
const colors = require('../../utils/embedColors');
const { EmbedBuilder } = require('discord.js');
const state = require('../../utils/sharedState');
const highlightsCache = require('../../utils/highlightsCache');

async function checkHighlights(message) {
	if (message.author.bot || !message.guild.id) return;

	log.debug(`Checking highlights for message`);

	const highlights = highlightsCache.get(message.guild.id);
	if (!highlights || highlights.length === 0) return;

	const dmPromises = [];

	for (const h of highlights) {
		if (message.content.toLowerCase().includes(h.phrase) && message.author.id !== h.userID) {
			const isCooldown = await state.getHLCoolDown();
			if (!isCooldown.has(h.userID)) {
				await state.addHLCoolDown(h.userID);

				const aviURL = message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || message.author.defaultAvatarURL;
				const name = message.author.username;
				const hEmbed = new EmbedBuilder()
					.setAuthor({ name: name, iconURL: aviURL })
					.setColor(colors.main)
					.setTitle('Highlighter Alert')
					.setDescription(`Found message containing phrase: \`${h.phrase}\`!`)
					.addFields({ name: 'Message', value: message.content })
					.setTimestamp();

				dmPromises.push(
					message.client.users.cache
						.get(h.userID)
						?.send({
							embeds: [hEmbed],
							content: `Jump to Message: ${message.url}`,
						})
						.catch(e => log.error(`Couldn't send highlight DM: ${e}`))
				);
			}
		}
	}

	await Promise.allSettled(dmPromises);
}

module.exports = { checkHighlights };
