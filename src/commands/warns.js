const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff.js');
const { extractSnowflake } = require('../utils/validate.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors.js');
const { Pagination } = require('@lanred/discordjs-button-embed-pagination');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warns')
		.setDescription("View a user's warnings")
		.addStringOption(option => option.setName('user').setDescription('The user to view warns for')),
	async execute(interaction) {
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages))
			return interaction.reply({
				content: "You're not staff, idiot",
				ephemeral: true,
			});

		await prisma.guild.upsert({
			where: { id: interaction.guild.id },
			update: {},
			create: { id: interaction.guild.id },
		});

		let target;

		if (!interaction.options.getString('user')) {
			return sendReply('error', 'No user entered');
		}

		let userString = interaction.options.getString('user');

		if (!extractSnowflake(userString)) {
			return sendReply('error', 'This is not a valid user');
		} else {
			target = extractSnowflake(userString)[0];
		}

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
				const embed = new EmbedBuilder().setTitle(`Warnings for user <@${target}>`).setColor(colors.main).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

				pageWarnings.forEach(warning => {
					embed.addFields({ name: warning[0], value: warning[1] });
				});

				pages.push(embed);
			}

			if (pages.length > 1) {
				await new Pagination(interaction, pages, 'Page', 600000).paginate();
			} else {
				await interaction.reply({ embeds: [pages[0]] });
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
