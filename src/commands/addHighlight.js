/**
 * @file Add Highlight Command
 * @description Command to create a new highlighted phrase to be notified for (not case sensitive)
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../utils/isStaff');
const { colors } = require('../config.json');
const log = require('../utils/log');
const prisma = require('../utils/prismaClient');
const { sendReply } = require('../utils/sendReply');
const { emojis } = require('../config.json');

module.exports = {
	/**
	 * Slash Command Data
	 * @type {SlashCommandBuilder}
	 */
	data: new SlashCommandBuilder()
		.setName('addhighlight')
		.setDescription('Create a new highlighted phrase to be notified for (not case sensitive)')
		.setDMPermission(false)
		.addStringOption(option => option.setName('phrase').setDescription("The phrase you'd like to highlight").setMaxLength(1_000).setRequired(true)),

	/**
	 * Execute the command
	 * @param {Object} interaction - The interaction object
	 */
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages))
			return sendReply(interaction, 'main', `${emojis.error}  You dont have the necessary permissions to complete this action`);

		let phrase = interaction.options.getString('phrase').toLowerCase();

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		let msgEmbed = new EmbedBuilder()
			.setTitle(`New Highlight Added`)
			.setColor(colors.main)
			.setDescription(`${emojis.success} Created highlight for ${phrase}`)
			.setTimestamp()
			.setAuthor({ name: name, iconURL: aviURL });

		await prisma.highlight
			.create({
				data: {
					phrase: phrase,
					guildId: interaction.guild.id,
					userID: interaction.user.id,
				},
			})
			.then(() => {
				interaction.editReply({ embeds: [msgEmbed] }).catch(e => {
					interaction.editReply(`${emojis.error} Message failed to send:\n${e}`);
				});
			})
			.catch(e => {
				log.error(`Could not create highlight: ${e}`);
			});
	},
};
