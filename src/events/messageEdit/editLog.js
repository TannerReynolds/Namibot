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
		.setTitle(`Message Edited (New Message)`)
		.setColor(colors.main)
		.addFields({ name: 'Old Message', value: oldContent }, { name: 'New Message', value: newContent })
		.setTimestamp()
		.setAuthor({ name: name, iconURL: aviURL });
	if (oldMessage.attachments) {
		getModChannels(message.client, message.guild.id).secondary.send({
			files: [...oldMessage.attachments.values()],
		});
	}
	getModChannels(message.client, message.guild.id).secondary.send({
		files: [...message.attachments.values()],
	});
	getModChannels(message.client, message.guild.id).secondary.send({
		embeds: [newEmbed],
		content: `UserID: ${message.author.id}`,
	});
}

module.exports = { editLog };
