const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaffCommand } = require('../utils/isStaff');
const { defineTarget } = require('../utils/defineTarget');
const prisma = require('../utils/prismaClient');
const { getModChannels } = require('../utils/getModChannels');
const { colors, emojis } = require('../config');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDMPermission(false)
		.setDescription('Unban a user from the server')
		.addStringOption(option => option.setName('user').setDescription('The user to unban.').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('The reason for unbanning this user').setRequired(true)),
	async execute(interaction) {
		log.debug('begin');
		await interaction.deferReply({ ephemeral: true });
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);
		if (!isStaffCommand(this.data.name, interaction, interaction.member, PermissionFlagsBits.BanMembers))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action`);
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			return sendReply(interaction, 'error', `${emojis.error}  This user does not exist`);
		}

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		let reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : 'no reason provided';

		interaction.guild.bans
			.remove(target, {
				reason: `${reason} | Mod: ${interaction.user.username} (${interaction.user.id})`,
			})
			.then(() => {
				let unbanEmbed = new EmbedBuilder()
					.setTitle(`User Unbanned`)
					.setColor(colors.success)
					.setDescription(`${emojis.success}  Successfully unbanned <@${target}>. Reason: ${reason}`)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				interaction.channel.send({ embeds: [unbanEmbed] });
				sendReply(interaction, 'main', `${emojis.success}  Interaction Complete`);
				if (reason.length > 1024) {
					reason = `${reason.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
				}
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
				return sendReply(interaction, 'error', `${emojis.error}  Error unbanning member: ${e}`);
			});

		await prisma.ban
			.delete({
				where: {
					userID_guildId: {
						userID: target,
						guildId: interaction.guild.id,
					},
				},
			})
			.catch(() => {
				// do nothing
				// Means they were banned not using the bot if this fails
			});
		log.debug('end');
	},
};
