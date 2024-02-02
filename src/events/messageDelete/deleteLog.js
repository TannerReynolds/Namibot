const { getModChannels } = require('../../utils/getModChannels');
const { EmbedBuilder } = require('discord.js');
const { colors } = require('../../config.json');

async function deleteLog(message) {
	if (!message.guild) return;
	if (message.author.bot) return;
	let content = message.cleanContent || message.content;
	if (content.length > 1024) {
		content = `${content.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
	}
	let aviURL = message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
		? message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
		: message.author.defaultAvatarURL;
	let name = message.author.username;
	let deleteEmbed = new EmbedBuilder()
		.setTitle(`Message Deleted`)
		.setColor(colors.main)
		.setDescription(`Channel: <#${message.channel.id}>`)
		.addFields({ name: 'Deleted Message', value: content || 'N/A' })
		.setTimestamp()
		.setAuthor({ name: name, iconURL: aviURL });
	if (message.attachments.size > 0) {
		getModChannels(message.client, message.guild.id).secondary.send({
			embeds: [deleteEmbed],
			files: [...message.attachments.values()],
			content: `UserID: ${message.author.id}`,
		});
	} else {
		getModChannels(message.client, message.guild.id).secondary.send({
			embeds: [deleteEmbed],
			content: `UserID: ${message.author.id}`,
		});
	}
}

module.exports = { deleteLog };
