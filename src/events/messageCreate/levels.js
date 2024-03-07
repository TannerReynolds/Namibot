const guildMemberCache = require("../../utils/guildMemberCache");
const log = require("../../utils/log");
const { guilds } = require("../../config.json");
const { AttachmentBuilder } = require("discord.js");

// Assuming a quadratic progression, define a coefficient for the quadratic term
// This coefficient determines how quickly levels increase in difficulty
// 839500 is the amount of xp a member should need to reach level 100
// Based on getting 2300xp every single day for an entire year (2300 * 365)
const a = 839500 / Math.pow(100, 2); // Adjust 'a' as needed to fit the desired difficulty curve

// Function to calculate level based on XP using a quadratic curve
function calculateLevel(xp) {
  // Adjust the formula to use a quadratic progression for levels
  // The formula for level based on XP can be derived from the quadratic equation: xp = a * level^2
  // Solving for level gives: level = sqrt(xp / a)
  return Math.floor(Math.sqrt(xp / a));
}

function addXP(guildId, userId, message) {
  if (!message.guild) return log.debug("end");
  try {
    log.debug("begin");
    guildMemberCache[guildId][userId].xp += 10;
    if (!guildMemberCache[guildId][userId].changed)
      guildMemberCache[guildId][userId].changed = true;

    let newLevel = calculateLevel(guildMemberCache[guildId][userId].xp);

    if (newLevel !== guildMemberCache[guildId][userId].level) {
      guildMemberCache[guildId][userId].level = newLevel;
      guildMemberCache[guildId][userId].changed = true;
      if (newLevel > 0) {
        giveRole(guildId, userId, message, newLevel);
        if (!guilds[message.guild.id].features.levels.levelUpMessage)
          return log.debug("end");

        message.reply(
          guilds[message.guild.id].features.levels.levelUpMessage.replace(
            /\{\{level\}\}/gi,
            guildMemberCache[guildId][userId].level,
          ),
        );

        let img = genImg(message, newLevel);
      }
    }
    log.debug("end");
  } catch (e) {
    log.error(`Error in addXP: ${e}`);
  }
}

async function genImg(message, level) {
  // Canvas implementation
  // Return buffer
}

async function giveRole(guildId, userId, message, level) {
  let levels = guilds[guildId].levels.roles;
  let levelsArr = [];
  for (const levelNum in levels) {
    levelsArr.push(levels[levelNum]);
  }
  for (const levelNum in levels) {
    if (level === levelNum) {
      const delRole = async () => {
        for (let i = 0; i < levelsArr.length; i++) {
          if (message.member.roles.cache.has(levelsArr[i])) {
            await message.member.roles.remove(levelsArr[i]);
          }
        }
      };

      await delRole();
      return message.member.roles.add(levels[levelNum]);
    }
  }
}
module.exports = { addXP };
