let debugMode = false;
let highlightCoolDown = new Set();

module.exports = {
	getDebugMode: function () {
		return debugMode;
	},
	setDebugMode: function (newValue) {
		debugMode = newValue;
	},
	getHLCoolDown: async function () {
		return highlightCoolDown;
	},
	addHLCoolDown: async function (userID) {
		highlightCoolDown.add(userID);
		setTimeout(() => highlightCoolDown.delete(userID), 600000);
	},
};
