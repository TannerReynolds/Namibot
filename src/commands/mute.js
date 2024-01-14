const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff');
const { extractSnowflake } = require('../utils/validate.js');
const { parseNewDate, durationToString, isValidDuration } = require('../utils/parseDuration.js');
const { PrismaClient } = require('@prisma/client');
const { guilds } = require('../config.json');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mute')
		.setDescription('Mute a user')
		.addStringOption(option => option.setName('user').setDescription('The user to mute.'))
		.addStringOption(option => option.setName('duration').setDescription('The amount of time to mute this user for'))
		.addStringOption(option => option.setName('reason').setDescription('The reason for muting this user')),
	async execute(interaction) {
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageRoles))
			return interaction.reply({
				content: "You're not staff, idiot",
				ephemeral: true,
			});

		await prisma.guild.upsert({
			where: { id: interaction.guild.id },
			update: {},
			create: { id: interaction.guild.id },
		});

		let target;

		if (!interaction.options.getString('user')) {
			return sendReply('error', 'No user entered');
		}

		let userString = interaction.options.getString('user');

		if (!extractSnowflake(userString)) {
			return sendReply('error', 'This is not a valid user');
		} else {
			target = extractSnowflake(userString)[0];
		}

		let duration;
		let durationString = 'eternity';
		let muteDate = new Date();
		if (!interaction.options.getString('duration')) {
			duration = 'infinite';
		} else {
			let rawDuration = interaction.options.getString('duration');
			if (await isValidDuration(rawDuration)) {
				duration = await parseNewDate(rawDuration);
				durationString = await durationToString(rawDuration);
			} else {
				duration = 'infinite';
			}
		}

		let reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : 'no reason provided';

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
		let name = interaction.user.username;
		let guildMember = await interaction.guild.members.fetch(target);

		await guildMember.roles.add(guilds[interaction.guild.id].muteRoleID);

		let muteEmbed = new EmbedBuilder()
			.setTitle(`User Muted`)
			.setColor(colors.success)
			.setDescription(`Successfully muted <@${target}> for ${durationString}. Reason: ${reason}`)
			.setTimestamp()
			.setAuthor({ name: name, iconURL: aviURL });

		interaction.reply({ embeds: [muteEmbed] });

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.reply({ embeds: [replyEmbed] });
		}

		if (duration !== 'infinite') {
			await prisma.mute.upsert({
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
					startDate: muteDate,
					duration: durationString,
				},
				create: {
					startDate: muteDate,
					userID: target,
					guildId: interaction.guild.id,
					moderator: `${interaction.user.username} (${interaction.user.id})`,
					endDate: duration,
					reason: reason,
					duration: durationString,
				},
			});
		}
		await prisma.warning.create({
			data: {
				userID: target,
				date: muteDate,
				guildId: interaction.guild.id,
				reason: reason,
				moderator: `${interaction.user.username} (${interaction.user.id})`,
				type: 'BAN',
			},
		});
	},
};
