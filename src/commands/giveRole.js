const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff, hasHigherPerms } = require('../utils/isStaff');
const { defineTarget } = require('../utils/defineTarget');
const colors = require('../utils/embedColors');
const { guilds } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('giverole')
		.setDescription('Give a role to a member')
		.setDMPermission(false)
		.addStringOption(option => option.setName('user').setDescription('The user to give the role to').setRequired(true))
		.addRoleOption(option => option.setName('role').setDescription('The role to give').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageRoles))
			return interaction.editReply({
				content: "You're not staff, idiot",
				ephemeral: true,
			});

		let target = await defineTarget(interaction, 'edit');

		let targetMember = await interaction.guild.members.fetch(target);
		if (!targetMember) return sendReply('error', 'This user is not a guild member');
		let canDoAction = await hasHigherPerms(interaction.member, targetMember);
		if (!canDoAction) {
			return sendReply('error', 'You or the bot does not have permissions to complete this action');
		}

		let selectedRole = await interaction.options.getRole('role');

		if (interaction.member.roles.highest.position <= selectedRole.position) {
			return sendReply('error', 'You dont have high enough permissions to grant this role');
		}
		if (selectedRole.id === guilds[interaction.guild.id].staffRoleID) {
			return sendReply('error', 'You cannot give the staff role');
		}
		if (selectedRole.permissions.has(PermissionFlagsBits.Administrator)) return sendReply('error', 'You cannot give roles with the Administrator permission');
		if (selectedRole.permissions.has(PermissionFlagsBits.BanMembers)) return sendReply('error', 'You cannot give roles with the Ban Members permission');
		if (selectedRole.permissions.has(PermissionFlagsBits.KickMembers)) return sendReply('error', 'You cannot give roles with the Kick Members permission');
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageChannels)) return sendReply('error', 'You cannot give roles with the Manage Channels permission');
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageGuild)) return sendReply('error', 'You cannot give roles with the Manage Guild permission');
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageMessages)) return sendReply('error', 'You cannot give roles with the Manage Messages permission');
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageEvents)) return sendReply('error', 'You cannot give roles with the Manage Events permission');
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageRoles)) return sendReply('error', 'You cannot give roles with the Manage Roles permission');
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageNicknames)) return sendReply('error', 'You cannot give roles with the Manage Nicknames permission');
		if (selectedRole.permissions.has(PermissionFlagsBits.MentionEveryone)) return sendReply('error', 'You cannot give roles with the Mention Everyone permission');
		if (selectedRole.permissions.has(PermissionFlagsBits.ManageNicknames)) return sendReply('error', 'You cannot give roles with the Manage Nicknames permission');

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
		let name = interaction.user.username;

		targetMember.roles
			.add(selectedRole.id)
			.then(r => {
				let roleEmbed = new EmbedBuilder()
					.setTitle(`Role Given`)
					.setColor(colors.main)
					.setDescription(`Successfully gave <@${target}> the ${selectedRole.name} role`)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				interaction.editReply({ embeds: [roleEmbed] });
			})
			.catch(e => {
				let roleEmbed = new EmbedBuilder().setTitle(`Error`).setColor(colors.error).setDescription(`Could not give role...\n${e}`).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

				interaction.editReply({ embeds: [roleEmbed] });
			});

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};
