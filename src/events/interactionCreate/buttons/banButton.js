const { ActionRowBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { isStaff } = require('../../../utils/isStaff');

async function banButton(interaction, args) {
	if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers)) return;
	let target = args[1];

	const modal = new ModalBuilder().setCustomId(`ban_${target}`).setTitle('Ban Member');
	const durationInput = new TextInputBuilder().setCustomId('duration').setLabel('Duration Of Ban').setStyle(TextInputStyle.Short);
	const reasonInput = new TextInputBuilder().setCustomId('reason').setLabel('Reason For Ban').setStyle(TextInputStyle.Paragraph);

	const firstActionRow = new ActionRowBuilder().addComponents(durationInput);
	const secondActionRow = new ActionRowBuilder().addComponents(reasonInput);
	modal.addComponents(firstActionRow, secondActionRow);

	await interaction.showModal(modal);
}

module.exports = { banButton };
