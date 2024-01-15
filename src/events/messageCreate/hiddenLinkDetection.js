async function checkForInlineURLs(client, content, message, getModChannels) {
	const inLineRegex = new RegExp(/\]\(<?https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)>?\)/gi);
	const urlRegex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi);

	if (content.match(inLineRegex)) {
		message.reply(`Inline/hidden URL detected. URLs found in message: ${content.match(urlRegex).join(', ')}`);
	}
}

module.exports = { checkForInlineURLs };
