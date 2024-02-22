const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { guilds, colors, emojis } = require('../config');
const log = require('../utils/log.js');
const { sendReply } = require('../utils/sendReply');
const prisma = require('../utils/prismaClient');
const { randomToken } = require('../utils/randomToken');

module.exports = {
	data: new ContextMenuCommandBuilder().setName('Report Message').setDMPermission(false).setType(ApplicationCommandType.Message),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		if (!guilds[interaction.guild.id].features.modMail) {
			return sendReply(interaction, 'error', `${emojis.error}  This server does not have mod mail enabled`);
		}

		let targetMessage = interaction.targetMessage || false;
		if (targetMessage === undefined || !targetMessage) {
			return sendReply(interaction, 'error', `${emojis.error}  This message does not exist`);
		}

		let message = targetMessage;
		let guild = interaction.guild;

		const existingMail = await prisma.mail.findFirst({
			where: {
				userID: interaction.user.id,
			},
		});

		let mailStatus = 1;
		if (existingMail) {
			mailStatus = 0;
		}

            // Create a modal
            const modal = new ModalBuilder()
                .setCustomId(`report_${randomToken(16, false)}_${message.id}_${mailStatus}`)
                .setTitle('Report Message');
            const textInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Why are you reporting this message, and is there any additional information you want to include?')
                .setStyle(TextInputStyle.Paragraph);

            // Add components to modal
            const firstActionRow = new ActionRowBuilder().addComponents(textInput);
            modal.addComponents(firstActionRow);

            // Show the modal to the user
			sendReply(interaction, 'success', 'Showing report menu')
            await interaction.showModal(modal);
	},
};