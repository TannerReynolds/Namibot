const { PermissionFlagsBits } = require("discord.js");
const { guilds } = require("../config.json");
const log = require("./log");

function isStaff(message, guildMember, permissionOverride) {
  if (!message.guild || !guildMember) return false;

  try {
    const guildID = message.guild.id;
    const guildConfig = guilds[guildID];
    if (!guildConfig) return false;

    if (guildMember.id === message.guild.ownerId) return true;

    if (guildMember.permissions.has(PermissionFlagsBits.Administrator)) return true;

    const staffRole = guildConfig.staffRoleID;
    const voiceModRole = guildConfig.voiceModRoleID;

    const hasStaffRole = staffRole && guildMember.roles.cache.has(staffRole);
    const hasVoiceModRole = voiceModRole && guildMember.roles.cache.has(voiceModRole);

    if (permissionOverride && guildMember.permissions.has(permissionOverride)) return true;
    if (hasStaffRole) return true;
    if (hasVoiceModRole) return true;

    return false;
  } catch (e) {
    log.error(e);
    return false;
  }
}

function isStaffCommand(commandName, message, guildMember, permissionOverride) {
  if (!message.guild || !guildMember) return false;

  const guildID = message.guild.id;
  const guildConfig = guilds[guildID];
  if (!guildConfig) return false;

  if (guildMember.id === message.guild.ownerId) return true;

  if (guildMember.permissions.has(PermissionFlagsBits.Administrator)) return true;

  const command = guildConfig.commands?.[commandName];
  if (!command) return false;

  const staffRole = guildConfig.staffRoleID;
  const voiceModRole = guildConfig.voiceModRoleID;

  const hasStaffRole = staffRole && guildMember.roles.cache.has(staffRole);
  const hasVoiceModRole = voiceModRole && guildMember.roles.cache.has(voiceModRole);

  if (permissionOverride && guildMember.permissions.has(permissionOverride)) return true;
  if (hasStaffRole && command.staffRoleCanUse) return true;
  if (hasVoiceModRole && command.voiceModRoleCanUse) return true;

  return false;
}

async function hasHigherPerms(author, target) {
  if (!author) return false;
  if (!target) return true;

  if (author.id === author.guild.ownerId) return true;

  if (author.permissions.has(PermissionFlagsBits.Administrator)) return true;

  if (!target.moderatable) return false;
  if (!target.manageable) return false;

  const authorHighestRolePosition = author.roles.highest.position;
  const targetHighestRolePosition = target.roles.highest.position;

  if (targetHighestRolePosition >= authorHighestRolePosition) {
    return false;
  }

  return true;
}

module.exports = { isStaff, isStaffCommand, hasHigherPerms };