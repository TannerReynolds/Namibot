/**
 * @file Add Highlight Command
 * @description Command to create a new highlighted phrase to be notified for (not case sensitive)
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff');
const { colors, emojis, guilds } = require('../config');
const log = require('../utils/log');
const prisma = require('../utils/prismaClient');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	/**
	 * Slash Command Data
	 * @type {SlashCommandBuilder}
	 */
	data: new SlashCommandBuilder()
		.setName('addreactrole')
		.setDescription('Create a new react role for a message')
		.setDMPermission(false)
		.addStringOption(option => option.setName('message_id').setDescription('The ID of the message you want to add a react role to').setMaxLength(20).setRequired(true))
		.addRoleOption(option => option.setName('role').setDescription('The role to give').setRequired(true))
		.addChannelOption(option => option.setName('channel').setDescription('Perform action in specific channel').setRequired(true))
		.addStringOption(option => option.setName('emoji').setDescription('The emoji to use for this role (must be an emoji the bot can access)').setMaxLength(100).setRequired(true)),
	/**
	 * Execute the command
	 * @param {Object} interaction - The interaction object
	 */
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageRoles))
			return sendReply(interaction, 'main', `${emojis.error}   You dont have the necessary permissions to complete this action`);

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

		let messageID = interaction.options.getString('message_id');
		let channel = interaction.options.getChannel('channel');

		let message = await channel.messages.fetch(messageID).catch(e => {
			return sendReply(interaction, 'main', `${emojis.error}  Error finding message (${messageID}): ${e}`);
		});

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		let msgEmbed = new EmbedBuilder()
			.setTitle(`New React Role Added`)
			.setColor(colors.main)
			.setDescription(`${emojis.success}  Created react role for <@&${selectedRole.id}> for ${message.url}`)
			.setTimestamp()
			.setAuthor({ name: name, iconURL: aviURL });

		await prisma.reactRole
			.create({
				data: {
					roleID: selectedRole.id,
					guildId: interaction.guild.id,
					messageID: messageID,
					channelID: channel.id,
					emoji: interaction.options.getString('emoji'),
				},
			})
			.then(() => {
				interaction.editReply({ embeds: [msgEmbed] }).catch(e => {
					interaction.editReply(`${emojis.error}  Message failed to send:\n${e}`);
				});
			})
			.catch(e => {
				log.error(`Could not create react role: ${e}`);
			});
	},
};
