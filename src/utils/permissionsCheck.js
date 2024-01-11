async function checkPermissions(interaction, permission) {
	if (!interaction || !permission) return false;
	if (!interaction.member) return false;
	let userPerms = interaction.member.permissions.has(permission);
	if (!userPerms) {
		return false;
	} else {
		return true;
	}
}

async function checkDefenderPermissions(interaction, permission) {
	let actionCount;
	if (permission === 'ManageMessages') {
		if (!anyStaffOnline(interaction)) {
			// Get database count for message deletes
		}
	} else if (permission === 'MuteMembers') {
		if (!anyStaffOnline(interaction)) {
			// Get database count for server mutes
		}
	} else {
		return false;
	}
}

async function anyStaffOnline(interaction) {
	let online = true;
	//Check to see if any staff are online
}

module.exports = { checkPermissions, checkDefenderPermissions };
