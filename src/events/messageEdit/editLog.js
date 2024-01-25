const { getModChannels } = require('../../utils/getModChannels');
const { EmbedBuilder } = require('discord.js');
const { colors } = require('../../config.json');
const log = require('../../utils/log');

async function editLog(message, oldMessage) {
	if (!message.guild) return;
	if (message.author.bot) return;
	let newContent = 'N/A';
	let oldContent = 'N/A';
	try {
		newContent = message.cleanContent || message.content;
		oldContent = oldMessage.cleanContent || message.content;
	} catch (e) {
		log.debug('No message content');
	}
	let aviURL = message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
		? message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
		: message.author.defaultAvatarURL;
	let name = message.author.username;
	let newEmbed = new EmbedBuilder()
		.setTitle(`Message Edited`)
		.setColor(colors.main)
		.setDescription(`Channel: <#${message.channel.id}>`)
		.addFields({ name: 'Old Message', value: oldContent || 'N/A' }, { name: 'New Message', value: newContent || 'N/A' })
		.setTimestamp()
		.setAuthor({ name: name, iconURL: aviURL });
	if (oldMessage.attachments.size > 0) {
		getModChannels(message.client, message.guild.id).secondary.send({
			files: [...oldMessage.attachments.values()],
		});
	}
	if (message.attachments.size > 0) {
		getModChannels(message.client, message.guild.id).secondary.send({
			files: [...message.attachments.values()],
		});
	}
	getModChannels(message.client, message.guild.id).secondary.send({
		embeds: [newEmbed],
		content: `UserID: ${message.author.id}`,
	});
}

module.exports = { editLog };
