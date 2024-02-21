const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { colors, emojis } = require('../config');
const log = require('../utils/log');
const { getLogPassword } = require('../utils/sharedState');
const { isStaffCommand } = require('../utils/isStaff');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder().setName('getlogpassword').setDMPermission(false).setDescription('Get the current log password'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);
		if (!isStaffCommand(this.data.name, interaction, interaction.member, PermissionFlagsBits.ManageMessages))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action`);

		interaction.user.send(`\`${getLogPassword()}\``).catch(e => {
			return sendReply(interaction, 'error', `${emojis.error}  I was not able to send you a DM`);
		});

		let doneEmbed = new EmbedBuilder().setColor(colors.main).setDescription(`${emojis.success}  Sent the current log password to your DMs!`).setTimestamp();

		return interaction.editReply({ embeds: [doneEmbed] });
	},
};
