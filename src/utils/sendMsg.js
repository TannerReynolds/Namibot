/* eslint-disable @typescript-eslint/no-var-requires */
const { EmbedBuilder } = require('discord.js');

let baseEmbed = new EmbedBuilder().setColor(0x432c84).setTimestamp();

const sendReply = async (interaction, type, message) => {
	if (type === 'error') {
		const errorEmbed = new EmbedBuilder().setColor(0xff6961).setTitle('❌ Error ❌').setDescription(message).setTimestamp();
		return interaction.reply({ embeds: [errorEmbed] });
	}
	if (type === 'success') {
		const successEmbed = new EmbedBuilder().setColor(0x432c84).setTitle('Success!').setDescription(message).setTimestamp();
		return interaction.reply({ embeds: [successEmbed] });
	}
};

module.exports = { sendReply, baseEmbed };
