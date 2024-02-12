const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isStaff } = require('../utils/isStaff');
const prisma = require('../utils/prismaClient');
const { colors, emojis, guilds } = require('../config');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('createconfirmation')
		.setDescription('Create a confirmation message for a user to get a role in return')
		.setDMPermission(false)
		.addChannelOption(option => option.setName('channel').setDescription('The channel to send the confirmation in').setRequired(true))
		.addRoleOption(option => option.setName('role').setDescription('The role to give').setRequired(true))
		.addStringOption(option => option.setName('message').setDescription('Message to send along with the confirmation').setMaxLength(2048))
		.addStringOption(option => option.setName('button_text').setDescription('The text that will appear on the button').setMaxLength(128)),
	async execute(interaction) {
		await interaction.deferReply();
		sendReply(interaction, 'main', `${emojis.loading}  Creating Confirmation Message...`);
		log.debug(`Getting staff status...`);
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageRoles))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action`);

		let selectedRole = await interaction.options.getRole('role');

		if (interaction.member.roles.highest.position <= selectedRole.position) {
			return sendReply(interaction, 'main', `${emojis.error}  You dont have high enough permissions to grant this role`);
		}
		if (selectedRole.id === guilds[interaction.guild.id].staffRoleID) {
			return sendReply(interaction, 'main', `${emojis.error}  You cannot give the staff role`);
		}
		if (selectedRole.permissions.has(PermissionFlagsBits.Administrator))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action: Administrator permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.BanMembers))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action: Ban Members permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.KickMembers))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action: Kick Members permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageChannels))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action: Manage Channels permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageGuild))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action: Manage Guild permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageMessages))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action: Manage Messages permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageEvents))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action: Manage Events permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageRoles))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action: Manage Roles permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageNicknames))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action: Manage Nicknames permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.MentionEveryone))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action: Mention Everyone permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageNicknames))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action: Manage Nicknames permission`);

		let channel = await interaction.options.getChannel('channel');
		let message = (await interaction.options.getString('message')) || false;
		let btnText = (await interaction.options.getString('button_text')) || 'Confirm';

		const confirmBtn = new ButtonBuilder().setCustomId('confirmation').setLabel(btnText).setStyle(ButtonStyle.Primary);
		const row = new ActionRowBuilder().addComponents(confirmBtn);

		let confirmID;
		try {
			if (message) {
				let msgEmbed = new EmbedBuilder().setColor(colors.main).setDescription(message);
				await channel.send({ embeds: [msgEmbed], components: [row] }).then(m => {
					confirmID = m.id;
				});
			} else {
				await channel.send({ components: [row] }).then(m => {
					confirmID = m.id;
				});
			}
		} catch (e) {
			confirmID = false;
			log.error(`Error sending confirmation message: ${e}`);
			return sendReply(interaction, 'main', `${emojis.error}  Error sending confirmation message: ${e}`);
		}

		await prisma.confirmation
			.create({
				data: {
					roleID: selectedRole.id,
					guildId: interaction.guild.id,
					messageID: confirmID,
					channelID: channel.id,
				},
			})
			.then(() => {
				return sendReply(interaction, 'main', `${emojis.success}  Confirmation message created!`);
			})
			.catch(e => {
				log.error(`Confirmation could not be created: ${e}`);
				return sendReply(interaction, 'main', `${emojis.error}  Confirmation could not be created: ${e}`);
			});
	},
};
