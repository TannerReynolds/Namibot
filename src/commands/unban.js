const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff');
const { defineTarget } = require('../utils/defineTarget');
const { PrismaClient } = require('@prisma/client');
const { getModChannels } = require('../utils/getModChannels');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors');
const log = require('../utils/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDMPermission(false)
		.setDescription('Unban a user from the server')
		.addStringOption(option => option.setName('user').setDescription('The user to unban.').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('The reason for unbanning this user').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return sendReply('main', "You're not a moderator, idiot");
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			return sendReply('error', 'This user does not exist');
		}

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			? interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			: interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		let reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : 'no reason provided';

		interaction.guild.bans
			.remove(target, {
				reason: `${reason} | Mod: ${interaction.user.username} (${interaction.user.id})`,
			})
			.then(b => {
				let unbanEmbed = new EmbedBuilder()
					.setTitle(`User Unbanned`)
					.setColor(colors.success)
					.setDescription(`Successfully unbanned <@${target}>. Reason: ${reason}`)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				interaction.editReply({ embeds: [unbanEmbed] });

				let logEmbed = new EmbedBuilder()
					.setColor(colors.main)
					.setTitle('Member Unbanned')
					.addFields({ name: 'User', value: `<@${target}> (${target})` }, { name: 'Reason', value: reason }, { name: 'Moderator', value: `${name} (${interaction.user.id})` })
					.setAuthor({ name: name, iconURL: aviURL })
					.setTimestamp();

				getModChannels(interaction.client, interaction.guild.id).main.send({
					embeds: [logEmbed],
					content: `<@${target}>`,
				});
			})
			.catch(e => {
				log.debug(`Error on unbanning user: ${target}\n\n${e}`);
				return sendReply('error', `Error unbanning member: ${e}`);
			});

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}

		await prisma.ban.delete({
			where: {
				userID_guildId: {
					userID: target,
					guildId: interaction.guild.id,
				},
			},
		});
	},
};
