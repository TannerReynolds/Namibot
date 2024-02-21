const log = require('../../utils/log');
const prisma = require('../../utils/prismaClient');
const highlightsCache = require('../../utils/highlightsCache');

/**
 * Refreshes the highlights cache for all guilds in the client.
 * @param {Discord.Client} client - The Discord client instance.
 * @returns {Promise<void>} - A promise that resolves once the cache has been refreshed.
 */
async function refreshHighlightsCache(client) {
	try {
		for (const guild of client.guilds.cache.values()) {
			const highlights = await prisma.highlight.findMany({ where: { guildId: guild.id } });
			highlightsCache.set(guild.id, highlights);
		}
	} catch (e) {
		log.error(`Error refreshing highlights cache: ${e}`);
	}
}

module.exports = { refreshHighlightsCache };
