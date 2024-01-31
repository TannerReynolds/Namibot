const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff');
const { defineTarget } = require('../utils/defineTarget');
const { colors } = require('../config.json');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('senddm')
		.setDescription('Send a DM to a user')
		.setDMPermission(false)
		.addStringOption(option => option.setName('user').setDescription('The user to message.').setRequired(true))
		.addStringOption(option => option.setName('msg').setDescription("the message you'd like to DM the user").setMaxLength(2_000).setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return sendReply('main', 'You dont have the necessary permissions to complete this action');
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			return sendReply('error', 'This user does not exist');
		}

		let msg = interaction.options.getString('msg');

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
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
