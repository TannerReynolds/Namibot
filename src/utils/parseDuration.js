const { DateTime, Duration } = require('luxon');
const { toENTime } = require('./toEN');
const log = require('./log');

const regexes = {
	years: /(\d+y)/i,
	months: /(\d+mo)/i,
	weeks: /(\d+w)/i,
	days: /(\d+d)/i,
	hours: /(\d+h)/i,
	minutes: /(\d+mi)/i,
	seconds: /(\d+s)/i,
};

async function parseNewDate(duration) {
	log.debug('Checking to see if date is Japanese');
	if (isJP(duration)) duration = await toENTime(duration);
	log.debug('Converting "m" to "mi" in parseNewDate');
	duration = await mToMi(duration);
	const parsedValues = {};
	log.debug(`Parsed values: ${parsedValues}`);

	for (const key in regexes) {
		const match = duration.match(regexes[key]);
		if (match) {
			parsedValues[key] = parseInt(match[0]);
		}
	}

	let parsedDuration = Duration.fromObject(parsedValues);
	let now = DateTime.local();
	let nowJS = new Date();
	let nwd = now.plus(parsedDuration).toJSDate();
	log.debug('checking nwd');

	if (!nwd) return new Date(2100, 0, 1);
	log.debug('nwd exists');
	if (nowJS.setFullYear(nowJS.getFullYear() + 10) < nwd) {
		log.debug(`nwd longer than 10 years: ${nwd}`);
		return new Date(2100, 0, 1);
	}

	log.debug(`Returning nwd: ${nwd}`);
	return nwd;
}
async function durationToString(duration) {
	if (isJP(duration)) duration = await toENTime(duration);
	duration = await mToMi(duration);
	const durationNames = {
		years: ['year', 'years'],
		months: ['month', 'months'],
		weeks: ['week', 'weeks'],
		days: ['day', 'days'],
		hours: ['hour', 'hours'],
		minutes: ['minute', 'minutes'],
		seconds: ['second', 'seconds'],
	};

	const parsedValues = [];

	for (const key in regexes) {
		const match = duration.match(regexes[key]);
		if (match) {
			const value = parseInt(match[0]);
			const word = value === 1 ? durationNames[key][0] : durationNames[key][1];
			parsedValues.push(`${value} ${word}`);
		}
	}

	return parsedValues.join(', ').replace(/,([^,]*)$/, ', and$1');
}

async function isValidDuration(duration) {
	if (isJP(duration)) duration = await toENTime(duration);
	duration = await mToMi(duration);
	for (const key in regexes) {
		const match = duration.match(regexes[key]);
		if (match) {
			return true;
		}
	}

	return false;
}

async function durationToSec(durationStr) {
	if (isJP(durationStr)) durationStr = await toENTime(durationStr);
	const parsedValues = {};

	for (const key in regexes) {
		const match = durationStr.match(regexes[key]);
		if (match) {
			parsedValues[key] = parseInt(match[1]);
		}
	}

	let parsedDuration = Duration.fromObject(parsedValues);
	return parsedDuration.as('seconds');
}

async function mToMi(text) {
	const minute = /(\d)m(?![imo])/g;
	return text.replace(minute, '$1mi');
}

const isJP = str => /[秒分時間日週月年]/.test(str);

module.exports = {
	parseNewDate,
	durationToString,
	isValidDuration,
	durationToSec,
};
