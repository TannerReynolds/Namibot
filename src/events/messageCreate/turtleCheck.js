const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const log = require('../../utils/log');

async function turtleCheck(message, guildMember) {
	log.debug(`Checking to see if user is a turtle`);
	let turtled = await prisma.turtleMode
		.findUnique({
			where: {
				userID_guildId: {
					userID: message.author.id,
					guildId: message.guild.id,
				},
			},
		})
		.catch(e => {
			log.error(`Error getting guild turtles: ${e}`);
		});

	if (!turtled) {
		return log.debug(`No turtles`);
	} else {
		log.debug(`Found a turtle`);
		return guildMember.timeout(turtled.interval * 1000, 'Automated TurtleMode Timeout');
	}
}

module.exports = { turtleCheck };
