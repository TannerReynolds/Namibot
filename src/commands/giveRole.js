const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaffCommand, hasHigherPerms } = require('../utils/isStaff');
const { defineTarget } = require('../utils/defineTarget');
const { guilds, colors, emojis } = require('../config');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('giverole')
		.setDescription('Give a role to a member')
		.setDMPermission(false)
		.addStringOption(option => option.setName('user').setDescription('The user to give the role to').setRequired(true))
		.addRoleOption(option => option.setName('role').setDescription('The role to give').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);
		if (!isStaffCommand(this.data.name, interaction, interaction.member, PermissionFlagsBits.ManageRoles))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action`);
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			return sendReply(interaction, 'error', `${emojis.error}  This user does not exist`);
		}

		let targetMember;

		try {
			targetMember = await interaction.guild.members.fetch(target);
		} catch (error) {
			if (error.message.toLowerCase().includes('unknown member')) {
				targetMember = false;
			} else {
				targetMember = false;
				log.debug(`failed to fetch member`);
			}
		}
		if (!targetMember) return sendReply(interaction, 'error', 'This user is not a guild member');
		let canDoAction = await hasHigherPerms(interaction.member, targetMember);
		if (!canDoAction) {
			return sendReply(interaction, 'error', `${emojis.error}  You or the bot does not have permissions to complete this action`);
		}

		let selectedRole = await interaction.options.getRole('role');

		if (interaction.member.roles.highest.position <= selectedRole.position) {
			return sendReply(interaction, 'error', `${emojis.error}  You dont have high enough permissions to grant this role`);
		}
		if (selectedRole.id === guilds[interaction.guild.id].staffRoleID) {
			return sendReply(interaction, 'error', `${emojis.error}  You cannot give the staff role`);
		}
		if (selectedRole.permissions.has(PermissionFlagsBits.Administrator))
			return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action'Administrator permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.BanMembers))
			return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action'Ban Members permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.KickMembers))
			return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action'Kick Members permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageChannels))
			return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action'Manage Channels permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageGuild))
			return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action'Manage Guild permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageMessages))
			return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action'Manage Messages permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageEvents))
			return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action'Manage Events permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageRoles))
			return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action'Manage Roles permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageNicknames))
			return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action'Manage Nicknames permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.MentionEveryone))
			return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action'Mention Everyone permission`);
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageNicknames))
			return sendReply(interaction, 'error', `${emojis.error}  You dont have the necessary permissions to complete this action'Manage Nicknames permission`);

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		targetMember.roles
			.add(selectedRole.id)
			.then(() => {
				let roleEmbed = new EmbedBuilder()
					.setTitle(`Role Given`)
					.setColor(colors.main)
					.setDescription(`${emojis.success}  Successfully gave <@${target}> the ${selectedRole.name} role`)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				interaction.channel.send({ embeds: [roleEmbed] });
				sendReply(interaction, 'main', `${emojis.success}  Interaction Complete`);
			})
			.catch(e => {
				let roleEmbed = new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(colors.error)
					.setDescription(`${emojis.error}  Could not give role...\n${e}`)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				interaction.editReply({ embeds: [roleEmbed] });
			});
	},
};
