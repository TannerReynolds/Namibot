const sharedState = require('./sharedState');
const fg = {
	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
};
const bg = {
	black: '\x1b[40m',
	red: '\x1b[41m',
	green: '\x1b[42m',
	yellow: '\x1b[43m',
	blue: '\x1b[44m',
	magenta: '\x1b[45m',
	cyan: '\x1b[46m',
	white: '\x1b[47m',
};
const endColor = '\x1b[0m';

function timestamp() {
	const time = new Date();
	return time.toLocaleString('en-US', {
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: true,
	});
}
function debugMode() {
	return sharedState.getDebugMode();
}
const beginningArrow = `${fg.red}  |> ${endColor}`;

function uncaughtError(log) {
	console.log(`${beginningArrow}${bg.red}[${timestamp()}]${endColor}${fg.red} | ${log}${endColor}`);
}
function success(log) {
	console.log(`${beginningArrow}${bg.green}[${timestamp()}]${endColor}${fg.green} | ${log}${endColor}`);
}
function warning(log) {
	console.log(`${beginningArrow}${bg.magenta}[${timestamp()}]${endColor}${fg.magenta} | ${log}${endColor}`);
}
function verbose(log) {
	console.log(`${beginningArrow}${bg.blue}[${timestamp()}]${endColor}${fg.blue} | ${log}${endColor}`);
}
/**
 * Function: debug
 *
 * Logs a message to the console when the application is in debug mode.
 * Provides helpful information about the location of the log, including the file name and line number,
 * as well as the time when the log was generated.
 *
 * @param {string} log - The message to be logged.
 *
 * @returns {void}
 */

function debug(log) {
	const fs = require('fs');
	// Only log the error if the application is in debug mode
	if (debugMode()) {
		// Create a new error so that we can extract the file name and line number
		const err = new Error();
		if (err === null) return;
		// @ts-ignore | Thinks that "err" has a possibility of not being defined.
		const stackLines = err.stack.split('\n');

		const lineInfo = stackLines[2].trim();

		console.log(`${beginningArrow}${bg.cyan}[${timestamp()}]${endColor}${fg.yellow} | //////////////// DEBUG LOG ////////////////${endColor}`);
		console.log(`${beginningArrow}${bg.cyan}[${timestamp()}]${endColor}${fg.yellow} | Location: ${lineInfo}${endColor}`);
		console.log(`${beginningArrow}${bg.cyan}[${timestamp()}]${endColor}${fg.black}${bg.yellow} | ${log}${endColor}${endColor}`);

		try {
			// Write the debug log to the file
			fs.appendFileSync('debug.log', `Location: ${lineInfo}\n[${timestamp()}] | ${log}\n\n`);
		} catch (error) {
			console.error(`An error occurred while writing to the log file: ${error}`);
		}
	}
}
module.exports = {
	uncaughtError,
	success,
	warning,
	verbose,
	debug,
};
