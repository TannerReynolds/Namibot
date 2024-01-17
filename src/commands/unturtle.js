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
		.setName('unturtle')
		.setDMPermission(false)
		.setDescription("Take away somebody's turtlemode")
		.addStringOption(option => option.setName('user').setDescription('The user to remove the slowdown from').setRequired(true)),
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

		let targetMember = await interaction.guild.members.fetch(target);
		if (!targetMember) return sendReply('error', 'This user is not a guild member');
		let canDoAction = await hasHigherPerms(interaction.member, targetMember);
		if (!canDoAction) {
			return sendReply('error', 'You or the bot does not have permissions to complete this action');
		}

		let turtleEmbed = new EmbedBuilder().setTitle(`Successfully disabled turtle mode!`).setColor(colors.success).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

		interaction.editReply({ embeds: [turtleEmbed] });

		let logEmbed = new EmbedBuilder()
			.setColor(colors.main)
			.setTitle('Member Turtlemode Disabled')
			.addFields({ name: 'User', value: `<@${target}> (${target})` }, { name: 'Moderator', value: `${name} (${interaction.user.id})` })
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

		await prisma.turtleMode.delete({
			where: {
				userID_guildId: {
					userID: target,
					guildId: interaction.guild.id,
				},
			},
		});
	},
};
