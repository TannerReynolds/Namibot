const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff.js');
const prisma = require('../utils/prismaClient.js');
const { colors } = require('../config.json');
const log = require('../utils/log.js');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deltag')
		.setDMPermission(false)
		.setDescription('Delete a tag')
		.addStringOption(option => option.setName('tag-id').setDescription('The ID of the tag to delete').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return sendReply('main', 'You dont have the necessary permissions to complete this action');

		if (!interaction.options.getString('tag-id')) {
			return sendReply('error', 'No tag ID provided!');
		}
		let tagID = interaction.options.getString('tag-id');

		if (isNaN(tagID)) return sendReply('error', 'Please enter the tag ID, the input entered is not a number');

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		await prisma.tag
			.delete({
				where: {
					id: Number(tagID),
					guildId: interaction.guild.id,
				},
			})
			.then(r => {
				let tagEmbed = new EmbedBuilder().setTitle(`Tag Deleted`).setColor(colors.main).setDescription(`tag ${tagID} Deleted`).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

				interaction.editReply({ embeds: [tagEmbed] });
			})
			.catch(e => {
				sendReply('error', `Could not delete tag...\n${e}`);
			});
	},
};
