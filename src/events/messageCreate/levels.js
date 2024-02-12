const guildMemberCache = require('../../utils/guildMemberCache');
const { guilds } = require('../../config');

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
	guildMemberCache[guildId][userId].xp += 10;
	if (!guildMemberCache[guildId][userId].changed) guildMemberCache[guildId][userId].changed = true;

	let newLevel = calculateLevel(guildMemberCache[guildId][userId].xp);

	if (newLevel !== guildMemberCache[guildId][userId].level) {
		guildMemberCache[guildId][userId].level = newLevel;
		guildMemberCache[guildId][userId].changed = true;
		if (newLevel > 0) {
			if (!guilds[message.guild.id].features.levels.levelUpMessage) return;
			message.reply(guilds[message.guild.id].features.levels.levelUpMessage.replace(/\{\{level\}\}/gi, guildMemberCache[guildId][userId].level));
		}
	}
}

module.exports = { addXP };
