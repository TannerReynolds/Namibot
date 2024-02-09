//const { isStaff } = require('../../utils/isStaff');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
//const prisma = require('../../utils/prismaClient');
const { guilds, colors, emojis, openAIToken } = require('../../config');
//const { getModChannels } = require('../../utils/getModChannels');
const log = require('../../utils/log');
const testChannel = '1205426225389109308';

async function aiModeration(message) {
	if (message.author.bot) return;
	if (!message.guild) return;
	if (!message.content || message.content.length < 1) return;
	if (message.content.length > 1999) return;
	//if (isStaff(message, message.member, PermissionFlagsBits.ManageMessages)) return;

	const url = 'https://api.openai.com/v1/moderations';

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
		});
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
					.setTitle('Message Flagged By OpenAI')
					.setDescription(`**Message Content**:\n${message.content}\n\n`)
					.addFields({ name: 'User', value: `${message.author.username} (${message.author.id})` })
					.setTimestamp();
			} catch (e) {
				log.error(`Error forming the log embed: ${e}`);
			}

			if (scores.some(score => score > 0.9)) {
				message.client.guilds.cache
					.get('438650836512669699')
					.channels.cache.get(testChannel)
					.send({ embeds: [logEmbed] });
			}
		}
	} catch (error) {
		log.error(`Failed to check message for moderation: ${error}`);
	}
}

module.exports = { aiModeration };
