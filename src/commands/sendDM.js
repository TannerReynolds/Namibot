const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff');
const { defineTarget } = require('../utils/defineTarget');
const colors = require('../utils/embedColors');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('senddm')
		.setDescription('Send a DM to a user')
		.setDMPermission(false)
		.addStringOption(option => option.setName('user').setDescription('The user to message.').setRequired(true))
		.addStringOption(option => option.setName('msg').setDescription("the message you'd like to DM the user").setMaxLength(2_000).setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers))
			return interaction.editReply({
				content: "You're not staff, idiot",
				ephemeral: true,
			});

		let target = await defineTarget(interaction, 'edit');

		let msg = interaction.options.getString('msg');

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
		let name = interaction.user.username;

		let targetUser = await interaction.client.users.cache.get(target);

		let msgEmbed = new EmbedBuilder().setTitle(`Message from ${interaction.guild.name}`).setColor(colors.main).setDescription(msg).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

		targetUser
			.send({ embeds: [msgEmbed] })
			.then(m => {
				interaction.editReply('Message successfully sent!');
			})
			.catch(e => {
				interaction.editReply(`Message failed to send:\n${e}`);
			});
	},
};
