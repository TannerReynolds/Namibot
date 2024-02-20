const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaffCommand } = require('../utils/isStaff.js');
const prisma = require('../utils/prismaClient.js');
const { colors, emojis } = require('../config');
const log = require('../utils/log.js');
const axios = require('axios');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('newtag')
		.setDMPermission(false)
		.setDescription('Create a tag for the server')
		.addStringOption(option => option.setName('tag-name').setDescription('What should the tag be called').setRequired(true))
		.addStringOption(option => option.setName('content').setDescription('The content of the tag').setMaxLength(1_900))
		.addAttachmentOption(option => option.setName('attachment').setDescription('Any attachments you want to be added to the tag')),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);
		if (!isStaffCommand(this.data.name, interaction, interaction.member, PermissionFlagsBits.ManageMessages))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action`);

		let tagName = interaction.options.getString('tag-name') ? interaction.options.getString('tag-name').toLowerCase() : false;
		let content = interaction.options.getString('content') ? interaction.options.getString('content') : false;
		let attachment = (await interaction.options.getAttachment('attachment')) ? interaction.options.getAttachment('attachment') : false;

		if (!content && !attachment) return sendReply(interaction, 'main', `${emojis.error}  You need to provide either content or an attachment for the tag`);

		if (content) content = content.replace(/\{\{newline\}\}/g, String.fromCharCode(10));

		const existingTag = await prisma.tag.findFirst({
			where: {
				name: tagName,
				guildId: interaction.guild.id,
			},
		});

		if (existingTag) {
			return sendReply(interaction, 'main', `${emojis.error}  A tag with that name already exists`);
		}

		let tagEmbed = new EmbedBuilder().setTitle(`New Tag Added`).setColor(colors.main).setTimestamp();

		if (content) {
			if (content.length > 1024) {
				content = `${content.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
			}
			tagEmbed.addFields({ name: 'Content', value: content });
		}
		if (attachment) tagEmbed.addFields({ name: 'Attachment', value: attachment.name });

		let attachmentData = null;
		if (attachment) {
			if (!attachment.width || attachment.width === null) {
				return sendReply(interaction, 'error', `${emojis.error}  This attachment is not recognized as an image`);
			}
			if (attachment.contentType.toLowerCase().includes('video')) {
				return sendReply(interaction, 'error', `${emojis.error}  This attachment is a video, please use an image/gif instead`);
			}
			if (attachment.size > 25_000_000) {
				return sendReply(interaction, 'error', `${emojis.error}  The attachment is too large. The maximum size is 25MB`);
			}
			try {
				attachmentData = await downloadAttachmentData(attachment.url);
			} catch (e) {
				log.error(e);
				return sendReply(interaction, 'error', `${emojis.error}  There was an error downloading this attachment: ${e}`);
			}

			if (!attachmentData) return sendReply(interaction, 'error', `${emojis.error}  There was an error downloading this attachment`);

			if (attachmentData.length > 25_000_000) {
				return sendReply(interaction, 'error', `${emojis.error}  The attachment is too large. The maximum size is 25MB`);
			}

			if (attachmentData.length === 0) {
				return sendReply(interaction, 'error', `${emojis.error}  The attachment is empty`);
			}
		}

		await prisma.tag
			.create({
				data: {
					name: tagName,
					guildId: interaction.guild.id,
					content: content ? content : null,
					attachmentName: attachment ? attachment.name : null,
					attachmentData: attachment ? attachmentData : null,
				},
			})
			.then(() => {
				interaction.channel.send({ embeds: [tagEmbed] });
				sendReply(interaction, 'main', `${emojis.success}  Interaction Complete`);
			})
			.catch(e => {
				log.error(e);
				return sendReply(interaction, 'error', `${emojis.error}  There was an error creating the tag: ${e}`);
			});

		async function downloadAttachmentData(url) {
			try {
				const response = await axios.get(url, {
					responseType: 'arraybuffer',
				});
				const buffer = Buffer.from(response.data, 'binary');
				return buffer;
			} catch (error) {
				log.error('Error downloading image:', error);
				return error;
			}
		}
	},
};
