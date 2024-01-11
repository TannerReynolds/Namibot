const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff');
const { extractSnowflake } = require('../utils/validate.js');
const { parseNewDate, durationToString, isValidDuration } = require('../utils/parseDuration.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a user from the server using either a mention or an id')
		.addStringOption(option => option.setName('user').setDescription('The user to ban.'))
		.addStringOption(option => option.setName('duration').setDescription('The amount of time to ban this user for'))
		.addStringOption(option => option.setName('reason').setDescription('The reason for banning this user')),
	async execute(interaction) {
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers))
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
		let banDate = new Date();
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

		interaction.guild.bans
			.create(target, {
				deleteMessageSeconds: 60 * 60 * 24 * 7,
				reason: `${reason} | Duration: ${durationString} | Mod: ${interaction.user.username} (${interaction.user.id})`,
			})
			.catch(e => {
				console.log(`Error on banning user: ${target}\n\n${e}`);
				return sendReply('error', `Error banning member: ${e}`);
			});

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
		let name = interaction.user.username;

		let banEmbed = new EmbedBuilder()
			.setTitle(`User Banned`)
			.setColor(colors.success)
			.setDescription(`Successfully banned <@${target}> for ${durationString}. Reason: ${reason}`)
			.setTimestamp()
			.setAuthor({ name: name, iconURL: aviURL });

		interaction.reply({ embeds: [banEmbed] });

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.reply({ embeds: [replyEmbed] });
		}

		if (duration !== 'infinite') {
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
		}
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
