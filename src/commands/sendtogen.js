const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('send')
		.setDMPermission(false)
		.setDescription('send msg to gen')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addStringOption(option => option.setName('msg').setDescription('msg to send')),
	async execute(interaction) {
		await interaction.deferReply();

		let toSend = interaction.options.getString('msg');

		interaction.client.guilds.cache.get('438650836512669699').channels.cache.get('438650836940357633').send(toSend);
	},
};
