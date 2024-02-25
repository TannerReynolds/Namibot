const { unshortenURL } = require('../../utils/unshortenURL');
const log = require('../../utils/log');
const { EmbedBuilder } = require('discord.js');
const { colors } = require('../../config');

async function unshortenMessageURLs(message) {
	log.debug('begin');
	if (!message.guild) {
		return log.debug('end');
	}
	if (message.author.bot) {
		return log.debug('end');
	}

	let urls = await detectURL(message.content);
	if (!urls || urls.length === 0) {
		return log.debug('end');
	}

	for (let url of urls) {
		unshortenURL(url).then(urls => {
			if (urls.length === 0) {
				return log.debug('end');
			}
			let aviURL = message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || message.author.defaultAvatarURL;
			let name = message.author.username;
			let formattedURLs = urls.map(url => `\`${url}\``);
			let urlString = formattedURLs.join(' ⇒ ');
			let unshortEmbed = new EmbedBuilder().setColor(colors.warning).setTitle('Shortened URL Detected').setDescription(urlString).setTimestamp().setAuthor({ name: name, iconURL: aviURL });
			message.reply({ embeds: [unshortEmbed] });

			//let blockedDomainsMessage = { guild: message.guild, bot: false, content: urlString, client: message.client };
		});
	}
	log.debug('end');
}

async function detectURL(string) {
	const urlReg = /https?:\/\/(www\.)?[a-zA-Z0-9\-.]+[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*/g;
	return string.match(urlReg);
}

module.exports = { unshortenMessageURLs };
