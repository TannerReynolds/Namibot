const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const log = require('../../utils/log');

async function deleteTurtles() {
	try {
		let now = new Date();

		let expiredTurts = await prisma.turtleMode.findMany({
			where: {
				endDate: {
					lt: now,
				},
			},
		});

		if (!expiredTurts) return;

		for (let turt of expiredTurts) {
			await prisma.turtleMode.delete({
				where: {
					userID_guildId: {
						userID: turt.userID,
						guildId: turt.guildId,
					},
				},
			});
		}
	} catch (error) {
		log.error('Failed to unturtle users:', error);
	}
}

module.exports = { deleteTurtles };
