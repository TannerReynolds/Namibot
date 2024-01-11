const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeFailedJoins() {
	let oneHourAgo = new Date();
	oneHourAgo.setHours(oneHourAgo.getHours() - 2);

	try {
		await prisma.failedJoin.deleteMany({
			where: {
				time: {
					lt: oneHourAgo,
				},
			},
		});
	} catch (error) {
		console.error('Error deleting old failed joins:', error);
	}
}

module.exports = { wipeFailedJoins };
