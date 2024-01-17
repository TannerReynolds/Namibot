const { domains } = require('../../utils/blockedDomains.json');
const log = require('../../utils/log');

async function blockedDomains(message) {
	if (!message.guild) return;
	if (message.author.bot) return;

	let urls = await detectURL(message.content);
	if (!urls || urls.length === 0) return;

	for (let url of urls) {
		let domainMatch = await extractDomain(url);
		if (domainMatch && domainMatch.length > 0) {
			let domain = domainMatch[0];
			if (isDomainBlocked(domain)) {
				break;
			}
		}
	}
}

async function detectURL(string) {
	const urlReg = /https?:\/\/(www\.)?[a-zA-Z0-9\-.]+[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*/g;
	return string.match(urlReg);
}

async function extractDomain(url) {
	const domainReg = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9\-\.]+)(?:[\/]|$)/;
	return url.match(domainReg);
}

function isDomainBlocked(domain) {
	return domains.includes(domain);
}

module.exports = { blockedDomains };
