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

module.exports = { isStaff };
