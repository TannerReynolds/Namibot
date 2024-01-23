const log = require('../../utils/log');
const colors = require('../../utils/embedColors');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { EmbedBuilder } = require('discord.js');
const state = require('../../utils/sharedState');

async function checkHighlights(message) {
	if (message.author.bot) return;
	if (!message.guild.id) return;

	log.debug(`beginning highlight checker`);
	let highlights = await prisma.highlight
		.findMany({
			where: {
				guildId: message.guild.id,
			},
		})
		.catch(e => {
			log.error(`Error finding highlights: ${e}`);
		});

	if (!highlights) return log.debug(`No highlights found`);

	log.debug(`Getting all highlights for the server`);
	counter = 1;
	for (let h of highlights) {
		let guildH = false;
		let userH = false;
		log.debug(`Found ${counter} highlights`);
		counter++;
		try {
			guildH = await message.client.guilds.cache.get(h.guildId);
			userH = await message.client.users.cache.get(h.userID);
			log.debug(`Got guildH and userH`);
		} catch (e) {
			log.error(`Couldn't get guild or user from Highlights: ${e}`);
		}
		if (!guildH || !userH) return;

		if (message.content.toLowerCase().includes(h.phrase)) {
			log.debug(`Found match`);
			if (message.author.id === h.userID) return;
			log.debug(`Match was not author`);
			let isCooldown = await state.getHLCoolDown();
			if (isCooldown.has(h.userID)) return log.debug(`user's highlight is in cooldown`);
			log.debug(`Adding user to cooldown`);
			state.addHLCoolDown(h.userID);
			log.debug(`Getting name and pfp defs`);
			let aviURL = message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
				? message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
				: message.author.defaultAvatarURL;
			let name = message.author.username;
			let hEmbed = new EmbedBuilder()
				.setAuthor({ name: name, iconURL: aviURL })
				.setColor(colors.main)
				.setTitle('Highlighter Alert')
				.setDescription(`Found message containing phrase: \`${h.phrase}\`!`)
				.addFields({ name: 'Message', value: message.content })
				.setTimestamp();
			log.debug(`Sending userH DM`);
			userH
				.send({
					embeds: [hEmbed],
					content: `Jump to Message: ${message.url}`,
				})
				.catch(e => {
					log.error(`Couldn't send user highlight DM: ${e}`);
				});
		} else {
			return log.debug(`No phrases matched...`);
		}
	}
}

module.exports = { checkHighlights };
