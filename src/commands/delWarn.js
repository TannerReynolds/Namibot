const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delwarn')
		.setDMPermission(false)
		.setDescription('Delete a warning for a user')
		.addStringOption(option => option.setName('warning-id').setDescription('The ID of the warning to delete').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return interaction.sendReply('main', "You're not a moderator, idiot");

		if (!interaction.options.getString('warning-id')) {
			return sendReply('error', 'No warning ID provided!');
		}
		let warningID = interaction.options.getString('warning-id');

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
		let name = interaction.user.username;

		await prisma.warning
			.delete({
				where: {
					id: warningID,
				},
			})
			.then(r => {
				let warnEmbed = new EmbedBuilder().setTitle(`Warning Deleted`).setColor(colors.main).setDescription(`Warning ${warningID} Deleted`).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

				interaction.editReply({ embeds: [warnEmbed] });
			})
			.catch(e => {
				sendReply('error', `Could not delete warning...\n${e}`);
			});

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};
