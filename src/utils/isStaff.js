const { guilds } = require("../config.json");

function isStaff(message, guildMember) {
  let staffRole = guilds[message.guild.id].staffRoleID;
  let hasRole = guildMember.roles.cache.has(staffRole);

  return hasRole;
}

module.exports = { isStaff };
