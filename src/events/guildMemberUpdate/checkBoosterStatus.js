const { guilds } = require("../../config.json");
const log = require("../../utils/log");

async function checkBoosterStatus(oldMember, newMember) {
  if (newMember.user.bot) return;
  if (
    newMember.premiumSince ||
    oldMember.premiumSince === newMember.premiumSince
  )
    return;

  let nitroColors =
    guilds[newMember.guild.id]?.features.nitroRoles.roles.map((r) => r.id) ||
    [];

  for (let color of nitroColors) {
    try {
      if (newMember.roles.cache.has(color)) {
        await newMember.roles.remove(color);
      }
    } catch (e) {
      log.error(
        `Failed to remove Nitro role ${color} from user ${newMember.id}: ${e}`,
      );
    }
  }
}

module.exports = { checkBoosterStatus };
