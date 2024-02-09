const prisma = require('./prismaClient');
const guildMemberCache = require('./guildMemberCache');
const log = require('./log');

async function initGuildMemberCache() {
	try {
		const guilds = await prisma.guild.findMany({
			include: {
				members: true,
			},
		});

		guilds.forEach(guild => {
			if (!guildMemberCache[guild.id]) {
				guildMemberCache[guild.id] = {};
			}

			guild.members.forEach(member => {
				guildMemberCache[guild.id][member.userID] = {
					xp: member.xp,
					level: member.level,
					messageCount: member.messageCount,
					changed: false,
				};
			});
		});

		log.verbose('Guild Members cache initialized with database guilds and members.');
	} catch (error) {
		log.error(`Failed to initialize guilds cache: ${error}`);
	}
}

async function syncMemberCache() {
	try {
		for (const guildId in guildMemberCache) {
			const members = guildMemberCache[guildId];
			for (const userId in members) {
				const member = members[userId];
				if (member.changed) {
					await prisma.member.upsert({
						where: {
							userID_guildId: { userID: userId, guildId: guildId },
						},
						update: {
							xp: member.xp,
							level: member.level,
							messageCount: member.messageCount,
						},
						create: {
							userID: userId,
							guildId: guildId,
							xp: member.xp,
							level: member.level,
							messageCount: member.messageCount,
						},
					});
					member.changed = false;
				}
			}
		}
		log.success('Cache successfully synchronized with the database.');
	} catch (error) {
		log.error(`Failed to synchronize cache with the database: ${error}`);
	}
}

module.exports = { initGuildMemberCache, syncMemberCache };
