const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff.js');
const prisma = require('../utils/prismaClient');
const colors = require('../utils/embedColors.js');
const { Pagination } = require('@lanred/discordjs-button-embed-pagination');
const log = require('../utils/log.js');

module.exports = {
	data: new SlashCommandBuilder().setName('highlights').setDMPermission(false).setDescription('View your highlights'),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return sendReply('main', 'You dont have the necessary permissions to complete this action');

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			? interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			: interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		try {
			const highlights = await prisma.highlight.findMany({
				where: {
					userID: interaction.user.id,
					guildId: interaction.guild.id,
				},
			});

			if (!highlights || highlights === undefined) {
				return sendReply('main', 'This user has no highlights.');
			}

			const formattedHighlights = highlights.map(h => {
				return [`ID: \`${h.id}\``, `Phrase: \`${h.phrase}\``];
			});

			if (formattedHighlights.length === 0) {
				return sendReply('main', 'This user has no highlights.');
			}

			const highlightsPerPage = 10;
			const pages = [];
			for (let i = 0; i < formattedHighlights.length; i += highlightsPerPage) {
				const pageHighlights = formattedHighlights.slice(i, i + highlightsPerPage);
				const embed = new EmbedBuilder()
					.setTitle('Active Highlights')
					.setDescription(`Showing all highlights for user <@${interaction.user.id}>`)
					.setColor(colors.main)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				pageHighlights.forEach(h => {
					embed.addFields({ name: h[0], value: h[1] });
				});

				pages.push(embed);
			}

			if (pages.length > 1) {
				await new Pagination(interaction, pages, 'Page', 600000).paginate();
			} else {
				await interaction.editReply({ embeds: [pages[0]] });
			}
		} catch (error) {
			sendReply('error', `Error fetching highlights: ${error}`);
			throw error;
		}

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};
