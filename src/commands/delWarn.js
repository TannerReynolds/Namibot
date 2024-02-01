const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff.js');
const prisma = require('../utils/prismaClient');
const { colors } = require('../config.json');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delwarn')
		.setDMPermission(false)
		.setDescription('Delete a warning for a user')
		.addStringOption(option => option.setName('warning-id').setDescription('The ID of the warning to delete').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return sendReply(interaction, 'main', 'You dont have the necessary permissions to complete this action');

		if (!interaction.options.getString('warning-id')) {
			return sendReply(interaction, 'error', 'No warning ID provided!');
		}
		let warningID = interaction.options.getString('warning-id');

		if (isNaN(warningID)) return sendReply(interaction, 'error', 'Please enter the warning ID, the input entered is not a number');

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		await prisma.warning
			.delete({
				where: {
					id: Number(warningID),
					guildId: interaction.guild.id,
				},
			})
			.then(() => {
				let warnEmbed = new EmbedBuilder().setTitle(`Warning Deleted`).setColor(colors.main).setDescription(`Warning ${warningID} Deleted`).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

				interaction.editReply({ embeds: [warnEmbed] });
			})
			.catch(e => {
				sendReply(interaction, 'error', `Could not delete warning...\n${e}`);
			});
	},
};
