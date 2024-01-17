let debugMode = false;

module.exports = {
	getDebugMode: function () {
		return debugMode;
	},
	setDebugMode: function (newValue) {
		debugMode = newValue;
	},
};
