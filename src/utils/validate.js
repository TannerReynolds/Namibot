async function isSnowflake(string) {
	let regex = /^\d{16,19}$/;
	return regex.test(string);
}
async function isEmoji(string) {
	let regex = /^<a?:\w+:\d{16,19}>$/;
	return regex.test(string);
}
function extractSnowflake(string) {
	const regex = /\b\d{16,19}\b/g;
	const matches = string.match(regex);
	return matches || [];
}

module.exports = { isSnowflake, isEmoji, extractSnowflake };
