const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff, hasHigherPerms } = require('../utils/isStaff');
const { PrismaClient } = require('@prisma/client');
const { defineTarget } = require('../utils/defineTarget');
const { defineDuration, defineDurationString } = require('../utils/defineDuration');
const { getModChannels } = require('../utils/getModChannels');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors');
const c = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a user from the server using either a mention or an id')
		.setDMPermission(false)
		.addStringOption(option => option.setName('user').setDescription('The user to ban.').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('The reason for banning this user').setRequired(true))
		.addStringOption(option => option.setName('duration').setDescription('The amount of time to ban this user for ("forever" for permanent)').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return interaction.sendReply('main', "You're not a moderator, idiot");
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			return sendReply('error', 'This user does not exist');
		}

		let targetMember = await interaction.guild.members.fetch(target);
		if (targetMember) {
			let canDoAction = await hasHigherPerms(interaction.member, targetMember);
			if (!canDoAction) {
				return sendReply('error', 'You or the bot does not have permissions to complete this action');
			}
		}

		let duration = await defineDuration(interaction);
		let durationString = await defineDurationString(interaction);
		let banDate = new Date();

		let reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : 'no reason provided';

		if (targetMember) {
			await targetMember.send(
				`You have been banned from ${interaction.guild.name} for \`${reason}\`. The length of your ban is ${durationString}. If you want to appeal this ban, run the /appeal command and fill out the information! To run the /appeal command here in our DMs, you need to join the bot's server:\n${c.appealServer}`
			);
		}

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
		let name = interaction.user.username;

		interaction.guild.bans
			.create(target, {
				deleteMessageSeconds: 60 * 60 * 24 * 7,
				reason: `${reason} | Duration: ${durationString} | Mod: ${interaction.user.username} (${interaction.user.id})`,
			})
			.then(b => {
				let banEmbed = new EmbedBuilder()
					.setTitle(`User Banned`)
					.setColor(colors.success)
					.setDescription(`Successfully banned <@${target}> for ${durationString}. Reason: ${reason}`)
					.setTimestamp()
					.setAuthor({ name: name, iconURL: aviURL });

				interaction.editReply({ embeds: [banEmbed] });

				let logEmbed = new EmbedBuilder()
					.setColor(colors.main)
					.setTitle('Member Banned')
					.addFields(
						{ name: 'User', value: `<@${target}> (${target})` },
						{ name: 'Reason', value: reason },
						{ name: 'Ban Duration', value: durationString },
						{ name: 'Moderator', value: `${name} (${interaction.user.id})` }
					)
					.setAuthor({ name: name, iconURL: aviURL })
					.setTimestamp();

				getModChannels(interaction.client, interaction.guild.id).main.send({
					embeds: [logEmbed],
					content: `<@${target}>`,
				});
			})
			.catch(e => {
				console.log(`Error on banning user: ${target}\n\n${e}`);
				return sendReply('error', `Error banning member: ${e}`);
			});

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}

		await prisma.ban.upsert({
			where: {
				userID_guildId: {
					userID: target,
					guildId: interaction.guild.id,
				},
			},
			update: {
				moderator: `${interaction.user.username} (${interaction.user.id})`,
				endDate: duration,
				reason: reason,
				startDate: banDate,
				duration: durationString,
			},
			create: {
				startDate: banDate,
				userID: target,
				guildId: interaction.guild.id,
				moderator: `${interaction.user.username} (${interaction.user.id})`,
				endDate: duration,
				reason: reason,
				duration: durationString,
			},
		});
		await prisma.warning.create({
			data: {
				userID: target,
				date: banDate,
				guildId: interaction.guild.id,
				reason: reason,
				moderator: `${interaction.user.username} (${interaction.user.id})`,
				type: 'BAN',
			},
		});
	},
};
