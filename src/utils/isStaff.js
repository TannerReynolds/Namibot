const { guilds } = require('../config.json');

function isStaff(message, guildMember, permissionOverride) {
	let staffRole = guilds[message.guild.id].staffRoleID;
	let hasRole = guildMember.roles.cache.has(staffRole);

	if (!guildMember.permissions.has(permissionOverride) && !hasRole) {
		return false;
	} else {
		return true;
	}
}

async function hasHigherPerms(author, target) {
	if (!author) {
		return false;
	}
	if (!target) {
		return true;
	}
	if (!target.moderatable) {
		return false;
	}
	if (!target.manageable) {
		return false;
	}
	const authorHighestRolePosition = author.roles.highest.position;
	const targetHighestRolePosition = target.roles.highest.position;

	if (targetHighestRolePosition >= authorHighestRolePosition) {
		return false;
	}

	return true;
}

module.exports = { isStaff, hasHigherPerms };
