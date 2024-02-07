const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { colors, emojis } = require('../config');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder().setName('dangerroles').setDMPermission(false).setDefaultMemberPermissions(PermissionFlagsBits.Administrator).setDescription('Find danger roles in your server'),
	async execute(interaction) {
		interaction.deferReply({ ephemeral: true });
		const roles = await interaction.guild.roles.fetch();
		const dangerRoles = findDangerRoles(roles);

		if (!dangerRoles || dangerRoles.length === 0) {
			return sendReply(interaction, 'main', `${emojis.success} You're safe! This server has no danger roles!`);
		} else {
			let responseEmbed = new EmbedBuilder().setTimestamp().setColor(colors.main).setTitle(`${emojis.success} Found Danger Roles!`);
			let dangerResponse = dangerRoles.map(r => `<@&${r.id}>`);
			responseEmbed.setDescription(`${dangerResponse.join(', ')}`);

			interaction.editReply({ embeds: [responseEmbed] });
		}

		function findDangerRoles(roles) {
			const modPermissions = [
				PermissionFlagsBits.Administrator,
				PermissionFlagsBits.BanMembers,
				PermissionFlagsBits.KickMembers,
				PermissionFlagsBits.ManageChannels,
				PermissionFlagsBits.ManageGuild,
				PermissionFlagsBits.ManageMessages,
				PermissionFlagsBits.ManageEvents,
				PermissionFlagsBits.ManageRoles,
				PermissionFlagsBits.ManageNicknames,
				PermissionFlagsBits.MentionEveryone,
			];

			const hasModPermissions = role => modPermissions.some(permission => role.permissions.includes(permission));

			const sortedRoles = roles.sort((a, b) => b.position - a.position);

			let dangerRoles = [];

			for (let i = 0; i < sortedRoles.length; i++) {
				for (let j = 0; j < i; j++) {
					const higherRole = sortedRoles[j];
					const currentRole = sortedRoles[i];

					if (hasModPermissions(currentRole) && !hasModPermissions(higherRole)) {
						dangerRoles.push(currentRole);
						break;
					}
				}
			}

			return dangerRoles;
		}
	},
};
