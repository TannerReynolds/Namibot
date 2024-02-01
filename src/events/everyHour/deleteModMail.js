const prisma = require('../../utils/prismaClient');
const log = require('../../utils/log');

async function deleteModMail(client) {
	try {
		let now = new Date();

		let expiredMail = await prisma.mail
			.findMany({
				where: {
					date: {
						lt: now,
					},
				},
			})
			.catch(() => {
				log.error(`Couldn't get expiredMail`);
			});

		if (!expiredMail) return log.debug(`no expired mail`);

		for (let m of expiredMail) {
			log.debug(`found mail`);
			await prisma.mail
				.delete({
					where: {
						userID_guildId_postID: {
							userID: m.userID,
							guildId: m.guildId,
							postID: m.postID,
						},
					},
				})
				.then(() => {
					let user = client.users.cache.get(m.userID);
					if (!user) return log.debug(`couldn't get user`);
					user.send(`Your mod mail connection in ${client.guilds.cache.get(m.guildId).name} has been deleted due to inactivity.`).catch(e => {
						log.error(e);
					});
				})
				.catch(e => {
					log.error(e);
				});
		}
	} catch (error) {
		return log.error(`Failed to delete mod mails: ${error}`);
	}
}

module.exports = { deleteModMail };
