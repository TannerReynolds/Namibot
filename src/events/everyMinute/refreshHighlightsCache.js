const log = require('../../utils/log');
const prisma = require('../../utils/prismaClient');
const highlightsCache = require('../../utils/highlightsCache');

async function refreshHighlightsCache(client) {
	try {
		for (const guild of client.guilds.cache.values()) {
			const highlights = await prisma.highlight.findMany({ where: { guildId: guild.id } });
			highlightsCache.set(guild.id, highlights);
			log.debug(`Refreshed highlights cache for guild: ${guild.id}`);
		}
	} catch (e) {
		log.error(`Error refreshing highlights cache: ${e}`);
	}
}

module.exports = { refreshHighlightsCache };
