/* eslint-disable no-useless-escape */
const { matchRegex } = require('../src/utils/processRegex');

async function extractSnowflake(str) {
	const regex = '(?<=:)(\\d+)(?=>)';
	try {
		const match = await matchRegex(regex, str); // Use await to wait for the Promise
		return match ? match[0] : null;
	} catch (error) {
		console.error(error);
		return null;
	}
}

// Since extractSnowflake is now async, we use .then to log the result
extractSnowflake('<:emoji:655444101440733184>').then(result => console.log(result));
