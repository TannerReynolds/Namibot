const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const prisma = require('../utils/prismaClient.js');
const { colors } = require('../config.json');
const log = require('../utils/log.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('t')
		.setDMPermission(false)
		.setDescription('Send a server tag')
		.addStringOption(option => option.setName('tag-name').setDescription('Name of the tag').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		let tagName = interaction.options.getString('tag-name') ? interaction.options.getString('tag-name').toLowerCase() : false;

		const tag = await prisma.tag.findFirst({
			where: {
				name: tagName,
				guildId: interaction.guild.id,
			},
		});

		if (!tag) {
			return sendReply('error', 'That tag does not exist');
		}

		let tagEmbed = new EmbedBuilder().setColor(colors.main);

		let attachmentData = null;

		if (tag.attachmentData !== null) {
			try {
				attachmentData = new AttachmentBuilder(Buffer.from(tag.attachmentData), { name: tag.attachmentName });
			} catch (e) {
				return sendReply('error', `There was an error forming the buffer attachment: ${e}`);
			}
		}

		if (tag.content) tagEmbed.setDescription(tag.content);
		if (attachmentData) tagEmbed.setImage(`attachment://${tag.attachmentName}`);

		if (attachmentData) {
			sendReply('main', 'Sending tag...');
			interaction.channel.send({ embeds: [tagEmbed], files: [attachmentData] });
		} else {
			sendReply('main', 'Sending tag...');
			interaction.channel.send({ embeds: [tagEmbed] });
		}

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};