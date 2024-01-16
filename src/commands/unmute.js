const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff, hasHigherPerms } = require('../utils/isStaff');
const { defineTarget } = require('../utils/defineTarget');
const { PrismaClient } = require('@prisma/client');
const { guilds } = require('../config.json');
const { getModChannels } = require('../utils/getModChannels');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unmute')
		.setDMPermission(false)
		.setDescription('Unmute a user')
		.addStringOption(option => option.setName('user').setDescription('The user to unmute.').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return interaction.sendReply('main', "You're not a moderator, idiot");
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			return sendReply('error', 'This user does not exist');
		}

		let targetMember = await interaction.guild.members.fetch(target);
		if (!targetMember) return sendReply('error', 'This user is not a guild member');
		let canDoAction = await hasHigherPerms(interaction.member, targetMember);
		if (!canDoAction) {
			return sendReply('error', 'You or the bot does not have permissions to complete this action');
		}

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
		let name = interaction.user.username;
		let guildMember = await interaction.guild.members.fetch(target);

		await guildMember.roles
			.remove(guilds[interaction.guild.id].muteRoleID)
			.then(m => {
				let muteEmbed = new EmbedBuilder()
					.setTitle(`User Unmuted`)
					.setColor(colors.success)
					.setDescription(`Successfully unmuted <@${target}>`)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				interaction.editReply({ embeds: [muteEmbed] });

				let logEmbed = new EmbedBuilder()
					.setColor(colors.main)
					.setTitle('Member Unmuted')
					.addFields({ name: 'User', value: `<@${target}> (${target})` }, { name: 'Reason', value: reason }, { name: 'Moderator', value: `${name} (${interaction.user.id})` })
					.setAuthor({ name: name, iconURL: aviURL })
					.setTimestamp();

				getModChannels(interaction.client, interaction.guild.id).main.send({
					embeds: [logEmbed],
					content: `<@${target}>`,
				});
			})
			.catch(e => {
				return sendReply('error', `Could not unmute user:\n${e}`);
			});

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}

		await prisma.mute.delete({
			where: {
				userID_guildId: {
					userID: target,
					guildId: interaction.guild.id,
				},
			},
		});
	},
};
