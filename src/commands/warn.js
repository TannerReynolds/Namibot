const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff.js');
const { extractSnowflake } = require('../utils/validate.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warn a member')
		.addStringOption(option => option.setName('user').setDescription('The user to warn'))
		.addStringOption(option => option.setName('reason').setDescription('The reason for warning this user')),
	async execute(interaction) {
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages))
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

		let reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : 'no reason provided';

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
		let name = interaction.user.username;

		let warnEmbed = new EmbedBuilder().setTitle(`User Warned`).setColor(colors.main).setDescription(`Warned <@${target}>. Reason: ${reason}`).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

		interaction.reply({ embeds: [warnEmbed] });

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.reply({ embeds: [replyEmbed] });
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
