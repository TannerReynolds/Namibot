const { parseNewDate, durationToString, isValidDuration } = require('./parseDuration');

async function defineDuration(interaction) {
	let duration;
	if (!interaction.options.getString('duration')) {
		duration = new Date(2100, 0, 1);
		return duration;
	} else {
		let rawDuration = interaction.options.getString('duration');
		if (await isValidDuration(rawDuration)) {
			duration = await parseNewDate(rawDuration);
			return duration;
		} else {
			duration = new Date(2100, 0, 1);
			return duration;
		}
	}
}
async function defineDurationString(interaction) {
	let durationString = 'eternity';
	if (!interaction.options.getString('duration')) {
		return durationString;
	} else {
		let rawDuration = interaction.options.getString('duration');
		if (await isValidDuration(rawDuration)) {
			durationString = await durationToString(rawDuration);
			return durationString;
		} else {
			return durationString;
		}
	}
}

module.exports = { defineDuration, defineDurationString };
