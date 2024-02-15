const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const guildMemberCache = require('../../utils/guildMemberCache');
const { guilds, colors } = require('../../config');
const { getModChannels } = require('../../utils/getModChannels');
const log = require('../../utils/log');

async function sentimentAnalysis(message) {
	if (message.author.bot) return;
	if (!message.guild) return;
	if (!message.content || message.content.length < 1) return;
	if (message.content.length > 1999) return;

	const url = 'https://api.openai.com/v1/moderations';
	const openAIToken = guilds[message.guild.id].features.sentimentAnalysis.openAIToken;

	const controller = new AbortController();
	const signal = controller.signal;
	const timeoutId = setTimeout(() => controller.abort(), 5000);

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${openAIToken}`,
			},
			body: JSON.stringify({
				input: message.content,
			}),
			signal: signal,
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
		}
		let data = await response.json();

		data = data.results[0];
		if (data.flagged) {
			let logEmbed = new EmbedBuilder();
			let scores = [];
			try {
				if (data.categories) {
					Object.entries(data.categories).forEach(([category, details]) => {
						if (details) {
							logEmbed.addFields({ name: category, value: JSON.stringify(details, null, 2) });
							Object.entries(data.category_scores).forEach(([category2, details2]) => {
								if (details2 && category2 === category) {
									scores.push(Number(JSON.stringify(details2, null, 2)));
									logEmbed.addFields({ name: category2, value: `Score: ${JSON.stringify(details2, null, 2)}` });
								}
							});
						}
					});
				}
				logEmbed
					.setColor(colors.main)
					.setTitle('Negative Sentiment Detected')
					.setDescription(`**Message Content**:\n${message.content}\n\n`)
					.addFields({ name: 'User', value: `${message.author.username} (${message.author.id})` })
					.setTimestamp();
			} catch (e) {
				log.error(`Error forming the log embed: ${e}`);
			}

			if (scores.some(score => score > guilds[message.guild.id].features.sentimentAnalysis.sensitivity)) {
				let negativeMessages = guildMemberCache[message.guild.id][message.author.id].negativeMessages || false;
				if (!negativeMessages || negativeMessages < 1) {
					guildMemberCache[message.guild.id][message.author.id].negativeMessages = 1;
				} else {
					guildMemberCache[message.guild.id][message.author.id].negativeMessages += 1;
				}
				if (!guildMemberCache[message.guild.id][message.author.id].changed) guildMemberCache[message.guild.id][message.author.id].changed = true;
				getModChannels(message.client, message.guild.id)
					.main.send({ embeds: [logEmbed], content: `<@${message.author.id}> | ${message.url}` })
					.catch(e => {
						log.error(`Error sending log to guild main log channel: ${e}`);
					});
				try {
					message.author.send(
						`Your message in ${
							message.guild.name
						} has been flagged for negative sentiment. Please be mindful of the content you post in the future, as repeated toxic behavior may result in moderation action. This message has been logged and sent to the moderation team for review.\n\n**Message Content**:\n\`\`\`${message.content.substring(
							0,
							1400
						)}\`\`\`\n`
					);
				} catch (e) {
					log.debug(`couldn't DM user for sentiment analysis: ${e}`);
				}
			}
		}
	} catch (error) {
		clearTimeout(timeoutId); // Clear the timeout if an error occurs

		if (error.name === 'AbortError') {
			log.debug('Fetch aborted due to timeout');
		} else {
			log.debug(`Failed to check message for moderation: ${error}`);
		}
	}
}

module.exports = { sentimentAnalysis };
