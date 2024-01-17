const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff, hasHigherPerms } = require('../utils/isStaff.js');
const { defineTarget } = require('../utils/defineTarget');
const { PrismaClient } = require('@prisma/client');
const { getModChannels } = require('../utils/getModChannels');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors.js');
const log = require('../utils/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDMPermission(false)
		.setDescription('Warn a member')
		.addStringOption(option => option.setName('user').setDescription('The user to warn').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('The reason for warning this user').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return sendReply('main', "You're not a moderator, idiot");
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

		let reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : 'no reason provided';

		if (targetMember) {
			await targetMember.send(`You have been warned in ${interaction.guild.name} for \`${reason}\`.`).catch(e => {
				log.debug("Couldn't send user WARN message");
			});
		}

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			? interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			: interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		let warnEmbed = new EmbedBuilder().setTitle(`User Warned`).setColor(colors.main).setDescription(`Warned <@${target}>. Reason: ${reason}`).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

		interaction.editReply({ embeds: [warnEmbed] });

		let logEmbed = new EmbedBuilder()
			.setColor(colors.main)
			.setTitle('Member Warned')
			.addFields({ name: 'User', value: `<@${target}> (${target})` }, { name: 'Reason', value: reason }, { name: 'Moderator', value: `${name} (${interaction.user.id})` })
			.setAuthor({ name: name, iconURL: aviURL })
			.setTimestamp();

		getModChannels(interaction.client, interaction.guild.id).main.send({
			embeds: [logEmbed],
			content: `<@${target}>`,
		});

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}

		await prisma.warning.create({
			data: {
				userID: target,
				date: new Date(),
				guildId: interaction.guild.id,
				reason: reason,
				moderator: `${interaction.user.username} (${interaction.user.id})`,
				type: 'WARN',
			},
		});
	},
};
