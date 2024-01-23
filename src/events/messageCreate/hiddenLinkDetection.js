const log = require('../../utils/log');
const inLineRegex = new RegExp(/\]\(<?https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)>?\)/gi);
const urlRegex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi);
async function checkForInlineURLs(client, content, message, getModChannels) {
	if (!message.channel.guild) return;
	if (message.author.bot) return;
	log.debug('searching for inline links');
	if (content.match(inLineRegex)) {
		log.debug(`found inline links: ${content.match(urlRegex).join(', ')}`);
		message.reply(`Inline/hidden URL detected. URLs found in message: ${content.match(urlRegex).join(', ')}`);
	} else {
		log.debug(`No inline links detected`);
	}
}

module.exports = { checkForInlineURLs };
