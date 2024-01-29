const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { colors } = require('../config.json');
const log = require('../utils/log');
const { getLogPassword } = require('../utils/sharedState');
const { isStaff, hasHigherPerms } = require('../utils/isStaff');

module.exports = {
	data: new SlashCommandBuilder().setName('getlogpassword').setDMPermission(false).setDescription('Get the current log password'),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return sendReply('main', 'You dont have the necessary permissions to complete this action');
		log.debug('Constructing banned words embed');

		log.debug('Sending user banned words DM');
		interaction.user.send(`\`${getLogPassword()}\``).catch(e => {
			log.debug(`Couldn't send user ${interaction.user.username} (${interaction.user.id}) the current log password: ${e}`);
			return sendReply('error', 'I was not able to send you a DM');
		});

		let doneEmbed = new EmbedBuilder().setColor(colors.main).setDescription('Sent the current log password to your DMs!').setTimestamp();

		return interaction.editReply({ embeds: [doneEmbed] });

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};
