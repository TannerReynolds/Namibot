const { getModChannels } = require('../../utils/getModChannels');
const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/embedColors');
const log = require('../../utils/log');

async function deleteLog(message) {
	if (!message.guild) return;
	if (message.author.bot) return;
	let content = message.cleanContent;
	let aviURL = message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 });
	let name = message.author.username;
	let deleteEmbed = new EmbedBuilder()
		.setTitle(`Message Deleted`)
		.setColor(colors.main)
		.setDescription(`Channel: <#${message.channel.id}>`)
		.addFields({ name: 'Deleted Message', value: content ? content : 'N/A' })
		.setTimestamp()
		.setAuthor({ name: name, iconURL: aviURL });
	if (message.attachments) {
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
