const prisma = require('../../utils/prismaClient');
const log = require('../../utils/log');

/**
 * Deletes expired turtle mode entries from the database.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
async function deleteTurtles() {
	try {
		let now = new Date();

		let expiredTurts = await prisma.turtleMode
			.findMany({
				where: {
					endDate: {
						lt: now,
					},
				},
			})
			.catch(() => {
				log.error(`Couldn't get expiredTurts`);
			});

		if (!expiredTurts) return log.debug(`no expired turts`);

		for (let turt of expiredTurts) {
			log.debug(`found turt`);
			await prisma.turtleMode
				.delete({
					where: {
						userID_guildId: {
							userID: turt.userID,
							guildId: turt.guildId,
						},
					},
				})
				.catch(e => {
					log.error(e);
				});
		}
	} catch (error) {
		return log.error('Failed to unturtle users:', error);
	}
}

module.exports = { deleteTurtles };
