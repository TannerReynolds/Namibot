const { EmbedBuilder, ChannelType } = require('discord.js');
const prisma = require('../../utils/prismaClient.js');
const { colors } = require('../../config.json');

async function modMailServer(message) {
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
		.then(m => {
			message.react('✅');
		})
		.catch(e => {
			message.reply(`Error sending message: ${e}`);
		});
}

async function modMailDM(message) {
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
				.then(m => {
					message.react('✅');
				})
				.catch(e => {
					message.reply(`Error sending message: ${e}`);
				});
		}
	});
}

module.exports = { modMailServer, modMailDM };
