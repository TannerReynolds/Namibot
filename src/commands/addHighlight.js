const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff');
const { colors } = require('../config.json');
const log = require('../utils/log');
const prisma = require('../utils/prismaClient');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addhighlight')
		.setDescription('Create a new highlighted phrase to be notified for (not case sensitive)')
		.setDMPermission(false)
		.addStringOption(option => option.setName('phrase').setDescription("The phrase you'd like to highlight").setMaxLength(1_000).setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return sendReply('main', 'You dont have the necessary permissions to complete this action');

		let phrase = interaction.options.getString('phrase').toLowerCase();

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		let msgEmbed = new EmbedBuilder().setTitle(`New Highlight Added`).setColor(colors.main).setDescription(`Created highlight for ${phrase}`).setTimestamp().setAuthor({ name: name, iconURL: aviURL });

		await prisma.highlight
			.create({
				data: {
					phrase: phrase,
					guildId: interaction.guild.id,
					userID: interaction.user.id,
				},
			})
			.then(r => {
				interaction.editReply({ embeds: [msgEmbed] }).catch(e => {
					interaction.editReply(`Message failed to send:\n${e}`);
				});
			})
			.catch(e => {
				log.error(`Could not create highlight: ${e}`);
			});
	},
};
