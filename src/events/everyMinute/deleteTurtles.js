const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
		console.error('Failed to unturtle users:', error);
	}
}

module.exports = { deleteTurtles };
