const { parseNewDate, durationToString, isValidDuration } = require('./parseDuration');

/**
 * Defines the duration based on the interaction options.
 * @param {Interaction} interaction - The interaction object.
 * @returns {Promise<Date>} The defined duration.
 */
async function defineDuration(interaction, manualDuration) {
	let duration;
	let usedDuration = false;
	try {
		usedDuration = interaction.options.getString('duration');
	} catch (e) {
		try {
			usedDuration = manualDuration;
		} catch (e) {
			// do nothing
		}
	}
	if (!usedDuration) {
		duration = new Date(2100, 0, 1);
		return duration;
	} else {
		let rawDuration = usedDuration;
		if (await isValidDuration(rawDuration)) {
			duration = await parseNewDate(rawDuration);
			return duration;
		} else {
			duration = new Date(2100, 0, 1);
			return duration;
		}
	}
}
/**
 * Defines the duration string based on the provided interaction.
 * @param {Interaction} interaction - The interaction object.
 * @returns {Promise<string>} The duration string.
 */
async function defineDurationString(interaction, manualDuration) {
	let durationString = 'eternity';
	let usedDuration = false;
	try {
		usedDuration = interaction.options.getString('duration');
	} catch (e) {
		try {
			usedDuration = manualDuration;
		} catch (e) {
			// do nothing
		}
	}
	if (!usedDuration) {
		return durationString;
	} else {
		let rawDuration = usedDuration;
		if (isJP(rawDuration)) durationString = `${rawDuration} (eternity)`;
		if (await isValidDuration(rawDuration)) {
			durationString = await durationToString(rawDuration);
			return durationString;
		} else {
			return durationString;
		}
	}
}

const isJP = str => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(str);

module.exports = { defineDuration, defineDurationString };
