/* eslint-disable no-useless-escape */
const log = require('../../utils/log');
const inLineRegex = new RegExp(/\]\(<?https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)>?\)/gi);
const urlRegex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi);
/**
 * Checks for inline URLs in a message and sends a reply if any are found.
 *
 * @param {Discord.Client} client - The Discord client object.
 * @param {string} content - The content of the message.
 * @param {Discord.Message} message - The message object.
 * @param {function} getModChannels - A function to get the moderation channels.
 * @returns {Promise<void>} - A promise that resolves once the check is complete.
 */
async function checkForInlineURLs(client, content, message) {
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
