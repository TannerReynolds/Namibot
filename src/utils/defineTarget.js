const { extractSnowflake, isSnowflake } = require('./validate');
const colors = require('./embedColors');
const { EmbedBuilder } = require('discord.js');

async function defineTarget(interaction, type) {
	if (!interaction.options.getString('user')) {
		return sendReply('error', 'No user entered', type);
	}

	let userString = interaction.options.getString('user');

	let userID = await getID(interaction, userString);
	if (userID) return userID;

	if (!isSnowflake(userString)) {
		return sendReply('error', 'This is not a valid user', type);
	} else {
		return extractSnowflake(userString)[0];
	}

	function sendReply(color, message, type) {
		let replyEmbed = new EmbedBuilder().setColor(colors[color]).setDescription(message).setTimestamp();
		if (type || !type) {
			interaction.reply({ embeds: [replyEmbed] });
		} else if (type.toLowerCase() === 'edit') {
			interaction.editReply({ embeds: [replyEmbed] });
		}
	}
	async function getID(interaction, input) {
		let member;
		await interaction.guild.members.fetch();
		input = input.toLowerCase();

		if (input.includes('#')) {
			const [username, discriminator] = input.split('#');
			member = interaction.guild.members.cache.find(member => member.user.username.toLowerCase() === username && member.user.discriminator === discriminator);
		} else {
			member = interaction.guild.members.cache.find(member => member.user.username.toLowerCase() === input);
		}

		return member ? member.user.id : null;
	}
}

module.exports = { defineTarget };
