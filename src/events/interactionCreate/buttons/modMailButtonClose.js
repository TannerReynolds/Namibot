const { sendReply } = require('../../../utils/sendReply');
const { colors, emojis } = require('../../../config');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../../../utils/isStaff');

async function modMailButtonClose(interaction) {
	await interaction.deferReply({ ephemeral: true });
	if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers))
		return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action`);

	let name = interaction.user.username;
	let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
	const finishedRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`disabled`).setLabel('Mod Mail Closed').setStyle(ButtonStyle.Secondary).setDisabled(true));

	if (interaction.channel.locked || interaction.channel.archived) return sendReply(interaction, 'error', `${emojis.error}  This channel is locked`);

	let unbanEmbed = new EmbedBuilder()
		.setTitle(`Mod Mail Resolved`)
		.setColor(colors.success)
		.setDescription(`${emojis.success}  Successfully closed this letter!`)
		.setTimestamp()
		.setAuthor({ name: name, iconURL: aviURL });

	await interaction.message.edit({ content: interaction.message.content, embeds: interaction.message.embeds, components: [finishedRow] });
	await interaction.channel.send({ embeds: [unbanEmbed] });
	await interaction.channel.setArchived(true);
	await sendReply(interaction, 'success', `${emojis.success}  Interaction Complete`);
}

module.exports = { modMailButtonClose };
