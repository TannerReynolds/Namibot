const { getModChannels } = require('../../utils/getModChannels');
const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/embedColors');

async function editLog(message, oldMessage) {
	if (!message.guild) return;
	if (message.author.bot) return;
	let newContent = message.cleanContent;
	let oldContent = oldMessage.cleanContent;
	let aviURL = message.author.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
	let name = message.author.username;
	let newEmbed = new EmbedBuilder()
		.setTitle(`Message Edited`)
		.setColor(colors.main)
		.setDescription(`Channel: <#${message.channel.id}>`)
		.addFields({ name: 'Old Message', value: oldContent ? oldContent : 'N/A' }, { name: 'New Message', value: newContent ? newContent : 'N/A' })
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
