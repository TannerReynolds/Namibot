const usersCache = require('../../utils/usersCache');
const log = require('../../utils/log');
const prisma = require('../../utils/prismaClient');

async function syncCacheWithDatabase() {
	// eslint-disable-next-line no-unused-vars
	const changedUsers = Object.entries(usersCache).filter(([_, userData]) => userData.changed);

	for (const [userId, userData] of changedUsers) {
		await prisma.user
			.upsert({
				where: { id: userId },
				update: {
					xp: userData.xp,
					level: userData.level,
				},
				create: {
					id: userId,
					xp: userData.xp,
					level: userData.level,
				},
			})
			.catch(error => {
				log.error(`Failed to sync user ${userId}: ${error}`);
			});

		userData.changed = false;
	}
}

module.exports = { syncCacheWithDatabase };
