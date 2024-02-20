const { guilds } = require('../config');

function isStaff(message, guildMember, permissionOverride) {
	let staffRole = guilds[message.guild.id].staffRoleID;
	let hasVoiceModRole = guilds[message.guild.id].voiceModRoleID;
	let hasStaffRole = guildMember.roles.cache.has(staffRole);

	if (!guildMember.permissions.has(permissionOverride) && !hasStaffRole && !hasVoiceModRole) {
		return false;
	} else {
		return true;
	}
}

function isStaffCommand(commandName, message, guildMember, permissionOverride) {
	let staffRole = guilds[message.guild.id].staffRoleID;
	let command = guilds[message.guild.id].commands[commandName];
	let voiceModRole = guilds[message.guild.id].voiceModRoleID;
	let hasStaffRole = guildMember.roles.cache.has(staffRole);
	let hasVoiceModRole = guildMember.roles.cache.has(voiceModRole);

	if (guildMember.permissions.has(permissionOverride)) {
		return true;
	}

	if (hasStaffRole && command.staffRoleCanUse) {
		return true;
	}

	if (hasVoiceModRole && command.voiceModRoleCanUse) {
		return true;
	}

	return false;
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

module.exports = { isStaff, isStaffCommand, hasHigherPerms };
