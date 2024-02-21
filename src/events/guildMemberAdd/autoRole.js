let { guilds } = require('../../config');
let log = require('../../utils/log');

async function autoRole(member) {
	if (!member) return;
	let currentGuild = guilds[member.guild.id];
	let autoRoles = currentGuild.features.autoRole.roles;
	if (!Array.isArray(autoRoles) || !autoRoles.every(role => typeof role === 'string')) {
		return log.error('Auto roles list is not an Array of Strings, please check your config');
	}
	for (let role of autoRoles) {
		try {
			await member.roles.add(role);
		} catch (e) {
			return;
		}
	}
}

module.exports = { autoRole };
