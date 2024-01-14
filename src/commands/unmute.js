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
		.setName('unmute')
		.setDescription('Unmute a user')
		.addStringOption(option => option.setName('user').setDescription('The user to unmute.')),
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

		let aviURL = interaction.user.avatarURL({ format: 'png', dynamic: false }).replace('webp', 'png');
		let name = interaction.user.username;
		let guildMember = await interaction.guild.members.fetch(target);

		await guildMember.roles.remove(guilds[interaction.guild.id].muteRoleID);

		let muteEmbed = new EmbedBuilder().setTitle(`User Unmuted`).setColor(colors.success).setDescription(`Successfully unmuted <@${target}>`).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

		interaction.reply({ embeds: [muteEmbed] });

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.reply({ embeds: [replyEmbed] });
		}
	},
};
