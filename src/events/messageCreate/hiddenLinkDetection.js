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
async function checkForInlineURLs(client, content, message, oldMessage) {
	log.debug('begin');
	if (!message.channel.guild) return;
	if (message.author.bot) return;

	if (oldMessage) {
		if (message.content === oldMessage.content) return;
	}
	if (content.match(inLineRegex)) {
		message.reply(`Inline/hidden URL detected. URLs found in message: ${content.match(urlRegex).join(', ')}`);
	}
	log.debug('end');
}

module.exports = { checkForInlineURLs };
