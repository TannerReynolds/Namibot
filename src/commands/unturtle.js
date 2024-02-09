const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff, hasHigherPerms } = require('../utils/isStaff.js');
const { defineTarget } = require('../utils/defineTarget');
const prisma = require('../utils/prismaClient');
const { getModChannels } = require('../utils/getModChannels');
const { colors, emojis } = require('../config');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unturtle')
		.setDMPermission(false)
		.setDescription("Take away somebody's turtlemode")
		.addStringOption(option => option.setName('user').setDescription('The user to remove the slowdown from').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action`);
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			return sendReply(interaction, 'error', `${emojis.error}  This user does not exist`);
		}

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

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
		if (!targetMember) return sendReply(interaction, 'error', `${emojis.error}  This user is not a guild member`);
		let canDoAction = await hasHigherPerms(interaction.member, targetMember);
		if (!canDoAction) {
			return sendReply(interaction, 'error', `${emojis.error}  You or the bot does not have permissions to complete this action`);
		}

		let turtleEmbed = new EmbedBuilder().setDescription(`${emojis.success}  Successfully disabled turtle mode!`).setColor(colors.success).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

		interaction.editReply({ embeds: [turtleEmbed] });

		let logEmbed = new EmbedBuilder()
			.setColor(colors.main)
			.setTitle('Member Turtlemode Disabled')
			.addFields({ name: 'User', value: `<@${target}> (${target})` }, { name: 'Moderator', value: `${name} (${interaction.user.id})` })
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
