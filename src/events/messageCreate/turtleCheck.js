const prisma = require('../../utils/prismaClient');
const log = require('../../utils/log');

async function turtleCheck(message, guildMember) {
	log.debug('begin');
	if (!message.guild) return log.debug('end');
	if (message.author.bot) return log.debug('end');
	try {
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
			return log.debug('end');
		} else {
			log.debug('end');
			return guildMember.timeout(turtled.interval * 1000, 'Automated TurtleMode Timeout');
		}
	} catch (e) {
		log.error(`Error in turtleCheck: ${e}`);
	}
}

module.exports = { turtleCheck };
