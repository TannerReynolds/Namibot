const { getModChannels } = require('../../utils/getModChannels');
const log = require('../../utils/log');
const { EmbedBuilder } = require('discord.js');
const { colors } = require('../../config');

async function deleteLog(message) {
	log.debug('begin');
	if (!message.guild) return;
	if (message.author.bot) return;
	try {
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
		log.debug('end');
	} catch (e) {
		log.error(`Error in deleteLog: ${e}`);
	}
}

module.exports = { deleteLog };
