const { EmbedBuilder, ChannelType } = require('discord.js');
const prisma = require('../../utils/prismaClient.js');
const log = require('../../utils/log');
const { colors, emojis } = require('../../config');

/**
 * Handles the mod mail server functionality.
 *
 * @param {Message} message - The message object received in the mod mail channel.
 * @returns {Promise<void>} - A promise that resolves once the mod mail response is sent.
 */
async function modMailServer(message) {
	log.debug('begin server');
	if (message.channel.type !== ChannelType.PublicThread) return;
	if (message.author.bot) return;

	const postId = message.channel.id;

	const mailEntry = await prisma.mail.findFirst({
		where: { postID: postId },
	});

	if (!mailEntry) return;

	let aviURL = message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || message.author.defaultAvatarURL;
	let mailEmbed = new EmbedBuilder()
		.setTitle(`Mod Mail Response From ${message.author.username} (${message.author.id})`)
		.setColor(colors.main)
		.setDescription(`\`${message.content}\``)
		.setAuthor({ name: message.author.username, iconURL: aviURL });

	const user = await message.client.users.fetch(mailEntry.userID).catch(() => null);
	if (!user) return;

	user
		.send({ embeds: [mailEmbed] })
		.then(() => {
			message.react(emojis.sent);
		})
		.catch(e => {
			message.reply(`${emojis.error}  Error sending message: ${e}`);
		});
	log.debug('end server');
}

/**
 * Sends a mod mail response to the appropriate thread channel.
 * @param {Message} message - The message object representing the mod mail response.
 * @returns {Promise<void>} - A promise that resolves once the response is sent.
 */
async function modMailDM(message) {
	log.debug('begin DM');
	if (message.channel.type !== ChannelType.DM) return;
	if (message.author.bot) return;

	const mailEntries = await prisma.mail.findMany({
		where: { userID: message.author.id },
	});

	let aviURL = message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || message.author.defaultAvatarURL;
	let mailEmbed = new EmbedBuilder()
		.setTitle(`Mod Mail Response From ${message.author.username} (${message.author.id})`)
		.setColor(colors.main)
		.setDescription(`\`${message.content}\``)
		.setAuthor({ name: message.author.username, iconURL: aviURL });

	mailEntries.forEach(async entry => {
		const thread = await message.client.channels.fetch(entry.postID).catch(() => null);
		if (thread && thread.type === ChannelType.PublicThread) {
			thread
				.send({ embeds: [mailEmbed] })
				.then(() => {
					message.react(emojis.sent);
				})
				.catch(e => {
					message.reply(`${emojis.error}  Error sending message: ${e}`);
				});
		}
	});
	log.debug('end DM');
}

module.exports = { modMailServer, modMailDM };
