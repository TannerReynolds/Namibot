const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prisma = require('../utils/prismaClient.js');
const { colors, emojis } = require('../config');
const { Pagination } = require('@lanred/discordjs-button-embed-pagination');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder().setName('tags').setDMPermission(false).setDescription("See the server's tags"),
	async execute(interaction) {
		await interaction.deferReply();

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		try {
			const tags = await prisma.tag.findMany({
				where: {
					guildId: interaction.guild.id,
				},
			});

			if (!tags || tags === undefined) {
				return sendReply(interaction, 'main', ` ${emojis.error}  This server has no tags.`);
			}

			const formattedtags = tags.map(tag => {
				return [`ID: \`${tag.id}\` | Name: \`${tag.name}\``, `Content: \`${tag.content ? tag.content : 'N/A'}\`\nAttachment: \`${tag.attachmentName ? tag.attachmentName : 'N/A'}\``];
			});

			if (formattedtags.length === 0) {
				return sendReply(interaction, 'main', `${emojis.error}  This server has no tags.`);
			}

			const tagsPerPage = 10;
			const pages = [];
			for (let i = 0; i < formattedtags.length; i += tagsPerPage) {
				const pagetags = formattedtags.slice(i, i + tagsPerPage);
				const embed = new EmbedBuilder()
					.setTitle('Tags')
					.setDescription(`Showing all tags for ${interaction.guild.name}`)
					.setColor(colors.main)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				pagetags.forEach(tag => {
					if (tag[1].length > 1024) {
						tag[1] = `${tag[1].substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
					}
					embed.addFields({ name: tag[0], value: tag[1] });
				});

				pages.push(embed);
			}

			if (pages.length > 1) {
				await new Pagination(interaction, pages, 'Page', 600000).paginate();
			} else {
				await interaction.editReply({ embeds: [pages[0]] });
			}
		} catch (error) {
			sendReply(interaction, 'error', `${emojis.error}  Error fetching tags: ${error}`);
			throw error;
		}
	},
};
