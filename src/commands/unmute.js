const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaffCommand, hasHigherPerms } = require('../utils/isStaff');
const { defineTarget } = require('../utils/defineTarget');
const prisma = require('../utils/prismaClient');
const { guilds, emojis } = require('../config');
const { getModChannels } = require('../utils/getModChannels');
const { colors } = require('../config');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unmute')
		.setDMPermission(false)
		.setDescription('Unmute a user')
		.addStringOption(option => option.setName('user').setDescription('The user to unmute.').setRequired(true)),
	async execute(interaction) {
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

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;
		let guildMember = false;
		try {
			guildMember = await interaction.guild.members.fetch(target);
		} catch (e) {
			try {
				await prisma.mute.delete({
					where: {
						userID_guildId: {
							userID: target,
							guildId: interaction.guild.id,
						},
					},
				});
			} catch (dbE) {
				return log.error(`Could not remove mute from guild after member leave`);
			}

			return sendReply(interaction, 'error', `${emojis.error}  User is not a member of this guild`);
		}

		try {
			await guildMember.roles.remove(guilds[interaction.guild.id].muteRoleID);
			let muteEmbed = new EmbedBuilder()
				.setTitle(`User Unmuted`)
				.setColor(colors.success)
				.setDescription(`Successfully unmuted <@${target}>`)
				.setTimestamp()
				.setAuthor({ name: name, iconURL: aviURL });

			await interaction.channel.send({ embeds: [muteEmbed] });
			sendReply(interaction, 'main', `${emojis.success}  Interaction Complete`);

			let logEmbed = new EmbedBuilder()
				.setColor(colors.main)
				.setTitle('Member Unmuted')
				.addFields({ name: 'User', value: `<@${target}> (${target})` }, { name: 'Moderator', value: `${name} (${interaction.user.id})` })
				.setAuthor({ name: name, iconURL: aviURL })
				.setTimestamp();

			if (targetMember) {
				logEmbed.setThumbnail(
					targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) ? targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) : targetMember.defaultAvatarURL
				);
			}

			await prisma.mute.delete({
				where: {
					userID_guildId: {
						userID: target,
						guildId: interaction.guild.id,
					},
				},
			});

			getModChannels(interaction.client, interaction.guild.id).main.send({
				embeds: [logEmbed],
				content: `<@${target}>`,
			});
		} catch (e) {
			log.error(`Error unmuting user: ${e}`);
			return sendReply(interaction, 'error', `${emojis.error}  Error unmuting user: ${e}`);
		}
	},
};
