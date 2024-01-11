const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAccountAge(member) {
	let age = member.user.createdAt;
	let today = new Date();
	let weekAgo = today.setDate(today.getDate() - 7);

	if (age > weekAgo) {
		await member
			.send(
				'Your account is newer than 7 days. Please do not attempt to rejoin this server until your account reaches 7 days old, or you may be considered a bot by our automated system and be banned.'
			)
			.catch(e => console.log('could not notify member'));
		member.kick('Account is newer than 7 days.').catch(e => {
			return console.log(e);
		});
		await prisma.failedJoin.create({
			data: {
				userID: member.user.id,
				guildId: member.guild.id,
			},
		});
		let count = await prisma.failedJoin.count({
			where: {
				userID: member.user.id,
				guildId: member.guild.id,
			},
		});
		if (count > 6) {
			member.guild.bans
				.create(member.user.id, {
					deleteMessageSeconds: 60 * 60 * 24 * 7,
					reason: `Suspected bot account, if you feel this is an error, please DM @namija | Duration: Infinite | Mod: System`,
				})
				.catch(e => {
					console.log(`Error on banning user automatically (newer than 7 days old): ${e}`);
				});
		}
	}
}

module.exports = { checkAccountAge };
