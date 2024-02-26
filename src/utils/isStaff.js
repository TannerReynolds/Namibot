const { guilds } = require('../config');
const log = require('./log');

function isStaff(message, guildMember, permissionOverride) {
	if (!message.guild) return false;
	try {
		const guildID = message.guild?.id;
		let staffRole = guilds[guildID].staffRoleID;
		let voiceModRole = guilds[guildID].voiceModRoleID;
		let hasStaffRole = guildMember.roles.cache.has(staffRole);
		let hasVoiceModRole = guildMember.roles.cache.has(voiceModRole);

		if (!guildMember.permissions.has(permissionOverride) && !hasStaffRole && !hasVoiceModRole) {
			return false;
		} else {
			return true;
		}
	} catch (e) {
		log.error(e);
	}
}

function isStaffCommand(commandName, message, guildMember, permissionOverride) {
	if (!message.guild) return false;
	const guildID = message.guild?.id;
	let staffRole = guilds[guildID].staffRoleID;
	let command = guilds[guildID].commands[commandName];
	let voiceModRole = guilds[guildID].voiceModRoleID;
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
