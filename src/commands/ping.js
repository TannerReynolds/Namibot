const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prisma = require('../utils/prismaClient');
const { colors } = require('../config.json');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDMPermission(false).setDescription('Pong'),
	async execute(interaction) {
		await interaction.deferReply();
		log.debug('upserting guild to database');
		await prisma.guild.upsert({
			where: { id: interaction.guild.id },
			update: {},
			create: { id: interaction.guild.id },
		});

		let pingEmbed = new EmbedBuilder().setColor(colors.main).setDescription('Pong').setTimestamp();

		interaction.editReply({ embeds: [pingEmbed] });
	},
};
