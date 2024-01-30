const { unshortenURL } = require("../../utils/unshortenURL")
const { EmbedBuilder } = require('discord.js');
const { colors } = require('../../config.json');

async function unshortenMessageURLs(message) {
    if (!message.guild) return;
	if (message.author.bot) return;

	let urls = await detectURL(message.content);
	if (!urls || urls.length === 0) return;

	for (let url of urls) {
		unshortenURL(url).then(urls => {
            if (urls.length === 0) return;
            let aviURL = message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || message.author.defaultAvatarURL;
		    let name = message.author.username;
            let formattedURLs = urls.map(url => `\`${url}\``);
			let urlString = formattedURLs.join(" ⇒ ");
            let unshortEmbed = new EmbedBuilder().setColor(colors.warning).setTitle('Shortened URL Detected').setDescription(urlString).setTimestamp().setAuthor({ name: name, iconURL: aviURL });
            message.reply({ embeds: [unshortEmbed] })
        })
	}
}

async function detectURL(string) {
	const urlReg = /https?:\/\/(www\.)?[a-zA-Z0-9\-.]+[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*/g;
	return string.match(urlReg);
}

module.exports = { unshortenMessageURLs }