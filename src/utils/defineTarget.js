const { extractSnowflake, isSnowflake } = require('./validate');
const { colors } = require('../config');
const { EmbedBuilder } = require('discord.js');

/**
 * Defines the target user based on the interaction and type.
 * @param {Object} interaction - The interaction object.
 * @param {string} type - The type of target.
 * @returns {Promise<string|null>} - The ID of the target user if found, otherwise null.
 */
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

	/**
	 * Sends a reply message with the specified color, message, and type.
	 * @param {string} color - The color of the reply message.
	 * @param {string} message - The content of the reply message.
	 */
	function sendReply(color, message) {
		let replyEmbed = new EmbedBuilder().setColor(colors[color]).setDescription(message).setTimestamp();
		interaction.editReply({ embeds: [replyEmbed] });
	}

	/**
	 * Retrieves the ID of a member based on the input provided.
	 * @param {Object} interaction - The interaction object.
	 * @param {string} input - The input to search for.
	 * @returns {Promise<string|null>} - The ID of the member if found, otherwise null.
	 */
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
