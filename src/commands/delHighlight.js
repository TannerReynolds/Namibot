const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff.js');
const prisma = require('../utils/prismaClient');
const { colors, emojis } = require('../config');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delhighlight')
		.setDMPermission(false)
		.setDescription('Delete a highlight!')
		.addStringOption(option => option.setName('id').setDescription('The ID of the highlight to delete').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages))
			return sendReply(interaction, 'main', `${emojis.error} You dont have the necessary permissions to complete this action`);

		if (!interaction.options.getString('id')) {
			return sendReply(interaction, 'error', `${emojis.error} No highlight ID provided!`);
		}
		let highlightID = interaction.options.getString('id');

		if (isNaN(highlightID)) return sendReply(interaction, 'error', `${emojis.error} Please enter the highlight ID, the input entered is not a number`);

		let highlight = await prisma.highlight.findUnique({
			where: {
				id: Number(highlightID),
				guildId: interaction.guild.id,
			},
		});

		if (highlight.userID !== interaction.user.id) {
			return sendReply(interaction, 'error', `${emojis.error} You can't delete somebody else's highlight!`);
		}

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		await prisma.highlight
			.delete({
				where: {
					id: Number(highlightID),
				},
			})
			.then(() => {
				let highlightEmbed = new EmbedBuilder()
					.setTitle(`Highlight Deleted`)
					.setColor(colors.main)
					.setDescription(`${emojis.success} Highlight \`${highlightID}\` Deleted`)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				interaction.editReply({ embeds: [highlightEmbed] });
			})
			.catch(e => {
				sendReply(interaction, 'error', `${emojis.error} Could not delete highlight...\n${e}`);
			});
	},
};
