const { extractSnowflake, isSnowflake } = require('./validate');
const { colors } = require('../config.json');
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
		if (!extractSnowflake(userString)[0]) {
			return sendReply('error', 'This is not a valid user', type);
		}
		return extractSnowflake(userString)[0];
	}

	function sendReply(color, message, type) {
		let replyEmbed = new EmbedBuilder().setColor(colors[color]).setDescription(message).setTimestamp();
		if (!type) {
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
			try {
				member = interaction.guild.members.cache.find(member => member.user.username.toLowerCase() === username && member.user.discriminator === discriminator);
			} catch (error) {
				member = false;
			}
		} else {
			try {
				member = interaction.guild.members.cache.find(member => member.user.username.toLowerCase() === input);
			} catch (error) {
				member = false;
			}
		}

		return member ? member.user.id : null;
	}
}

module.exports = { defineTarget };
