const usersCache = require("../../utils/usersCache")

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

function addUserToCache(userId) {
    if (!usersCache[userId]) {
      usersCache[userId] = { xp: 0, level: 1, changed: false };
    }
}

// Updated function to add XP and calculate new level accordingly
function addXP(userId) {
  if (!usersCache[userId]) addUserToCache(userId);

  let user = usersCache[userId];
  user.xp += 10;
  user.changed = true;

  let newLevel = calculateLevel(user.xp);

  if (newLevel !== user.level) {
    user.level = newLevel;
    user.changed = true;
  }
}

module.exports = { addXp }