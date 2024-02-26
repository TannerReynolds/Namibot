const sharedState = require('./sharedState');
const fs = require('fs');
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

let debugLogs = [];
function debugMode() {
	return sharedState.getDebugMode();
}
const beginningArrow = `${fg.red}  |> ${endColor}`;

function error(log) {
	console.log(`${beginningArrow}${bg.red}[${timestamp()}]${endColor}${fg.red} | ${log}${endColor}`);
	if (debugMode()) {
		debug(log);
		writeDebugLogs();
	}
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
	//const fs = require('fs');
	// Only log the error if the application is in debug mode
	if (debugMode()) {
		// Create a new error so that we can extract the file name and line number
		const err = new Error();
		if (err === null) return;
		const stackLines = err.stack.split('\n');

		const lineInfo = stackLines[2].trim();

		let logText = `////////////////\nLocation: ${lineInfo}\n[${timestamp()}] | ${log}\n////////////////\n`;
		debugLogs.push(logText);
	}
}

function debugconsole(log) {
	if (debugMode()) {
		console.log(`${beginningArrow}${bg.magenta}[${timestamp()}]${endColor}${fg.magenta} | ${log}${endColor}`);
	}
}

function writeDebugLogs() {
	if (debugLogs.length === 0) return;
	if (debugMode()) {
		verbose('Writing debug logs to debug.log');
		fs.writeFileSync(`${randomToken(7, false)}debug.log`, debugLogs.join('\n'), 'utf8');
		success('Debug logs written to debug.log');
		debugLogs = [];
	}
}

module.exports = {
	error,
	success,
	warning,
	verbose,
	debug,
	debugconsole,
	writeDebugLogs,
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
