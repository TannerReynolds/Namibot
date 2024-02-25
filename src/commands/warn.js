const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaffCommand, hasHigherPerms } = require('../utils/isStaff.js');
const { defineTarget } = require('../utils/defineTarget');
const prisma = require('../utils/prismaClient');
const { getModChannels } = require('../utils/getModChannels');
const { colors, emojis } = require('../config');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDMPermission(false)
		.setDescription('Warn a member')
		.addStringOption(option => option.setName('user').setDescription('The user to warn').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('The reason for warning this user').setRequired(true)),
	async execute(interaction) {
		log.debug('begin');
		await interaction.deferReply({ ephemeral: true });
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);
		if (!isStaffCommand(this.data.name, interaction, interaction.member, PermissionFlagsBits.ManageMessages))
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
			}
		}
		if (!targetMember) return sendReply(interaction, 'error', `${emojis.error}  This user is not a guild member`);
		let canDoAction = await hasHigherPerms(interaction.member, targetMember);
		if (!canDoAction) {
			return sendReply(interaction, 'error', `${emojis.error}  You or the bot does not have permissions to complete this action`);
		}

		let reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : 'no reason provided';

		if (targetMember) {
			await targetMember.send(`You have been warned in ${interaction.guild.name} for \`${reason}\`.`).catch(() => {});
		}

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		let warnEmbed = new EmbedBuilder()
			.setTitle(`User Warned`)
			.setColor(colors.main)
			.setDescription(`${emojis.success}  Warned <@${target}>. Reason: ${reason}`)
			.setTimestamp()
			.setAuthor({ name: name, iconURL: aviURL });

		interaction.channel.send({ embeds: [warnEmbed] });
		sendReply(interaction, 'main', `${emojis.success}  Interaction Complete`);
		if (reason.length > 1024) {
			reason = `${reason.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
		}
		let logEmbed = new EmbedBuilder()
			.setColor(colors.main)
			.setTitle('Member Warned')
			.addFields({ name: 'User', value: `<@${target}> (${target})` }, { name: 'Reason', value: reason }, { name: 'Moderator', value: `${name} (${interaction.user.id})` })
			.setAuthor({ name: name, iconURL: aviURL })
			.setTimestamp();

		if (targetMember) {
			logEmbed.setThumbnail(
				targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) ? targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) : targetMember.defaultAvatarURL
			);
		}

		getModChannels(interaction.client, interaction.guild.id).main.send({
			embeds: [logEmbed],
			content: `<@${target}>`,
		});

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
		log.debug('end');
	},
};
