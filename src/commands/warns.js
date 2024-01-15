const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff.js');
const { defineTarget } = require('../utils/defineTarget');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors.js');
const { Pagination } = require('@lanred/discordjs-button-embed-pagination');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warns')
		.setDMPermission(false)
		.setDescription("View a user's warnings")
		.addStringOption(option => option.setName('user').setDescription('The user to view warns for').setRequired(true)),
	async execute(interaction) {
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages))
			return interaction.editReply({
				content: "You're not staff, idiot",
				ephemeral: true,
			});

		let target = await defineTarget(interaction, 'edit');

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
		let name = interaction.user.username;

		try {
			const warnings = await prisma.warning.findMany({
				where: {
					userID: target,
					guildId: interaction.guild.id,
				},
			});

			if (!warnings) {
				sendReply('main', 'This user has no warnings.');
			}

			const formattedWarnings = warnings.map(warning => {
				const formattedDate = warning.date.toISOString().split('T')[0].replace(/-/g, '/');
				return [`ID: \`${warning.id}\` | Date: ${formattedDate}`, `Type: ${warning.type} | Staff: ${warning.moderator} | Reason: ${warning.reason}`];
			});

			const warningsPerPage = 10;
			const pages = [];
			for (let i = 0; i < formattedWarnings.length; i += warningsPerPage) {
				const pageWarnings = formattedWarnings.slice(i, i + warningsPerPage);
				const embed = new EmbedBuilder()
					.setTitle('Warnings')
					.setDescription(`Showing all warnings for user <@${target}>`)
					.setColor(colors.main)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				pageWarnings.forEach(warning => {
					embed.addFields({ name: warning[0], value: warning[1] });
				});

				pages.push(embed);
			}

			if (pages.length > 1) {
				await new Pagination(interaction, pages, 'Page', 600000).paginate();
			} else {
				await interaction.editReply({ embeds: [pages[0]] });
			}
		} catch (error) {
			sendReply('error', `Error fetching warnings: ${error}`);
			throw error;
		}

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.reply({ embeds: [replyEmbed] });
		}
	},
};
