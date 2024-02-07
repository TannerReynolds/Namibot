const { colors } = require('../config');
const { EmbedBuilder } = require('discord.js');

function sendReply(interaction, type, message) {
	let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

	interaction.editReply({ embeds: [replyEmbed] });
}

module.exports = { sendReply };
