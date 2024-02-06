const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff.js');
const { defineTarget } = require('../utils/defineTarget');
const prisma = require('../utils/prismaClient');
const { colors, emojis } = require('../config.json');
const { Pagination } = require('@lanred/discordjs-button-embed-pagination');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warns')
		.setDMPermission(false)
		.setDescription("View a user's warnings")
		.addStringOption(option => option.setName('user').setDescription('The user to view warns for').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages))
			return sendReply(interaction, 'main', `${emojis.error} You dont have the necessary permissions to complete this action`);
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			return sendReply(interaction, 'error', `${emojis.error} This user does not exist`);
		}

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		try {
			const warnings = await prisma.warning.findMany({
				where: {
					userID: target,
					guildId: interaction.guild.id,
				},
			});

			if (!warnings || warnings === undefined) {
				return sendReply(interaction, 'main', `${emojis.error} This user has no warnings.`);
			}

			const formattedWarnings = warnings.map(warning => {
				const formattedDate = warning.date.toISOString().split('T')[0].replace(/-/g, '/');
				return [`ID: \`${warning.id}\` | Date: ${formattedDate}`, `Type: ${warning.type} | Staff: ${warning.moderator} | Reason: ${warning.reason}`];
			});

			if (formattedWarnings.length === 0) {
				return sendReply(interaction, 'main', `${emojis.error} This user has no warnings.`);
			}

			const warningsPerPage = 10;
			const pages = [];
			for (let i = 0; i < formattedWarnings.length; i += warningsPerPage) {
				const pageWarnings = formattedWarnings.slice(i, i + warningsPerPage);
				const embed = new EmbedBuilder()
					.setTitle('Warnings')
					.setDescription(`${emojis.success} Showing all warnings for user <@${target}>`)
					.setColor(colors.main)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				pageWarnings.forEach(warning => {
					if (warning[1].length > 1024) {
						warning[1] = `${warning[1].substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
					}
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
			sendReply(interaction, 'error', `${emojis.error} Error fetching warnings: ${error}`);
			throw error;
		}
	},
};
