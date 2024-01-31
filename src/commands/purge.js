const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors } = require('../config.json');
const log = require('../utils/log.js');
const { getModChannels } = require('../utils/getModChannels');
const { isStaff } = require('../utils/isStaff');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('purge')
		.setDMPermission(false)
		.setDescription('Purge a bunch of messages from the channel')
		.addStringOption(option => option.setName('amount').setDescription('Number of messages to delete. Maximum: 500').setRequired(true))
		.addUserOption(option => option.setName('user').setDescription('Filter messages by a specific user'))
		.addBooleanOption(option => option.setName('media').setDescription('Filter messages containing media'))
		.addChannelOption(option => option.setName('channel').setDescription('Perform action in specific channel'))
		.addStringOption(option => option.setName('includes').setDescription('Filter messages that include specific content'))
		.addBooleanOption(option => option.setName('bots').setDescription('Filter messages sent by bots')),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return sendReply('main', 'You dont have the necessary permissions to complete this action');

		const amount = interaction.options.getInteger('amount');
		if (isNaN(amount)) return sendReply('error', 'Please enter a valid number for the amount');
		if (amount < 1) return sendReply('error', 'Must be a number greater than 1');
		if (amount > 500) return sendReply('error', 'Must be a number less than 500');
		const user = interaction.options.getUser('user') ? interaction.options.getUser('user') : false;
		const media = interaction.options.getBoolean('media') ? interaction.options.getBoolean('media') : false;
		const bots = interaction.options.getBoolean('bots') ? interaction.options.getBoolean('bots') : false;
		const channel = interaction.options.getChannel('channel') ? interaction.options.getChannel('channel') : interaction.channel;
		const contentIncludes = interaction.options.getString('includes') ? interaction.options.getString('includes').toLowerCase() : false;

		const messages = await channel.messages.fetch({ limit: amount });

		const filteredMessages = messages.filter(m => {
			if (user) {
				if (m.author.id !== user.id) return false;
			}
			if (media) {
				if (!m.attachments.size > 0 && !m.embeds.length > 0) return false;
			}
			if (bots) {
				if (!m.author.bot) return false;
			}
			if (contentIncludes) {
				if (!m.content.toLowerCase().includes(contentIncludes)) return false;
			}
			return true;
		});

		await channel
			.bulkDelete(filteredMessages, true)
			.then(messages => {
				return sendReply('main', `Successfully deleted ${messages.size} messages.`);
			})
			.catch(error => {
				log.error(error);
				return sendReply('error', 'There was an error trying to purge messages in this channel!');
			});

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};
