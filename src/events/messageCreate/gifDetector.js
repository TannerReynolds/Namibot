const log = require('../../utils/log');
const { guilds } = require('../../config');

/**
 * Detects if a message contains a GIF and takes appropriate action.
 * @param {Message} message - The message object.
 * @returns {Promise<void>} - A promise that resolves once the detection is complete.
 */
async function gifDetector(message) {
	log.debug('begin');
	if (!message.channel.guild) return;
	if (message.author.bot) return;

	let hasGif = false;
	let allowedChannels = guilds[message.guild.id].features.gifDetector.allowedChannels;
	let messageChannel = message.channel.id;

	if (allowedChannels.includes(messageChannel)) return;

	let urls = (await detectURL(message.content)) || false;

	if (urls) {
		if (urls[0].includes('.gif')) {
			hasGif = true;
		}
	}

	if (message.attachments.size > 0) {
		hasGif = message.attachments.some(a => a.contentType && a.contentType.toLowerCase().includes('gif'));
	}

	if (!hasGif && message.embeds.length > 0) {
		hasGif = message.embeds.some(embed => {
			if (embed.url && embed.url.includes('.gif')) {
				return true;
			}

			if (embed.type === 'image' && embed.thumbnail && embed.thumbnail.url) {
				return embed.thumbnail.url.includes('.gif');
			}

			return false;
		});
	}

	if (hasGif) {
		message.reply('Gif Detected, please no gifs').then(r => {
			message.delete();
			setTimeout(() => {
				return r.delete();
			}, 4000);
		});
	} else {
		return;
	}

	async function detectURL(string) {
		const urlReg = /https?:\/\/(www\.)?[a-zA-Z0-9\-.]+[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*/g;
		return string.match(urlReg);
	}
	log.debug('end');
}

module.exports = { gifDetector };
