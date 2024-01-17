const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const log = require('../../utils/log');

async function wipeFailedJoins() {
	let oneHourAgo = new Date();
	oneHourAgo.setHours(oneHourAgo.getHours() - 1);

	try {
		await prisma.failedJoin.deleteMany({
			where: {
				time: {
					lt: oneHourAgo,
				},
			},
		});
	} catch (error) {
		log.error('Error deleting old failed joins:', error);
	}
}

module.exports = { wipeFailedJoins };
