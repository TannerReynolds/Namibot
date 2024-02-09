const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { botOwnerID, colors, emojis } = require('../config');
const sharedState = require('../utils/sharedState');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('debugmode')
		.setDMPermission(false)
		.setDescription('Turn debug mode on or off')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addBooleanOption(option => option.setName('state').setDescription('on or off').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (interaction.user.id !== botOwnerID) {
			return interaction.editReply(`${emojis.error}  Only the bot owner can run this command`);
		}
		let boolean = interaction.options.getBoolean('state');
		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;
		sharedState.setDebugMode(boolean);
		let responseEmbed = new EmbedBuilder().setTimestamp().setColor(colors.main).setAuthor({ name: name, iconURL: aviURL }).setTitle(`${emojis.success}  Set Debug Mode To ${boolean}`);

		interaction.editReply({ embeds: [responseEmbed] });
	},
};
