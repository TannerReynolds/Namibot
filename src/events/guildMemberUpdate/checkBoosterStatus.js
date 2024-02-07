const prisma = require('../utils/prismaClient');

async function checkBoosterStatus(newMember) {
	if (newMember.user.bot) return;
	if (newMember.premiumSince !== null) return;

	let guild = newMember.guild;

	let nitroColors = await prisma.nitroColor.findMany({
		where: {
			guildId: interaction.guild.id,
		},
	});

	const delRole = async () => {
		for (let i = 0; i < nitroRoleIDs.length; i++) {
			if (newMember.roles.cache.has(nitroRoleIDs[i])) {
				await newMember.roles.remove(nitroRoleIDs[i]);
			}
		}
	};
}

module.exports = { checkBoosterStatus };
