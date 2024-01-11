const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff.js');
const { extractSnowflake } = require('../utils/validate.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const colors = require('../utils/embedColors.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unturtle')
		.setDescription("Take away somebody's turtlemode")
		.addStringOption(option => option.setName('user').setDescription('The user to remove the slowdown from')),
	async execute(interaction) {
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages))
			return interaction.reply({
				content: "You're not staff, idiot",
				ephemeral: true,
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

		let turtleEmbed = new EmbedBuilder().setTitle(`Successfully disabled turtle mode!`).setColor(colors.success).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

		interaction.reply({ embeds: [turtleEmbed] });

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
