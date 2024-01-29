let debugMode = false;
let highlightCoolDown = new Set();
let logPassword = randomToken(32, true);

module.exports = {
	getDebugMode: function () {
		return debugMode;
	},
	getLogPassword: function () {
		return logPassword;
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

function randomToken(number, symbols) {
	number = parseInt(number, 10);
	let text = '';
	let possible;
	if (symbols !== true) {
		possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	} else {
		possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()-_=+[]{}|;:/?><,.';
	}
	for (let i = 0; i < number; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
