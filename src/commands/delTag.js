const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaffCommand } = require('../utils/isStaff.js');
const prisma = require('../utils/prismaClient.js');
const { colors, emojis } = require('../config');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deltag')
		.setDMPermission(false)
		.setDescription('Delete a tag')
		.addStringOption(option => option.setName('tag-id').setDescription('The ID of the tag to delete').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);
		if (!isStaffCommand(this.data.name, interaction, interaction.member, PermissionFlagsBits.ManageMessages))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action`);

		if (!interaction.options.getString('tag-id')) {
			return sendReply(interaction, 'error', `${emojis.error}  No tag ID provided!`);
		}
		let tagID = interaction.options.getString('tag-id');

		if (isNaN(tagID)) return sendReply(interaction, 'error', `${emojis.error}  Please enter the tag ID, the input entered is not a number`);

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		await prisma.tag
			.delete({
				where: {
					id: Number(tagID),
					guildId: interaction.guild.id,
				},
			})
			.then(() => {
				let tagEmbed = new EmbedBuilder()
					.setTitle(`Tag Deleted`)
					.setColor(colors.main)
					.setDescription(`${emojis.success}  tag ${tagID} Deleted`)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				interaction.channel.send({ embeds: [tagEmbed] });
				sendReply(interaction, 'main', `${emojis.success}  Interaction Complete`);
			})
			.catch(e => {
				sendReply(interaction, 'error', `${emojis.error}  Could not delete tag...\n${e}`);
			});
	},
};
