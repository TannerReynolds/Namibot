const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { colors } = require('../config.json');
const { isStaff } = require('../utils/isStaff');
const { unshortenURL } = require('../utils/unshortenURL');
const log = require('../utils/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unshort')
		.setDMPermission(false)
		.setDescription("Unshorten a URL")
		.addStringOption(option => option.setName('url').setDescription('The URL to unshorten').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers) && interaction.channel.id !== commandChannel)
		return sendReply('main', `You have to go to the <#${commandChannel}> channel to use this command`);

		let url = interaction.options.getString('url')
		
		unshortenURL(url).then(urls => {
			if(urls.length === 0) return sendReply('main', "This does not appear to be a shortened URL");
			let formattedURLs = urls.map(url => `\`${url}\``);
			let urlString = formattedURLs.join(" ⇒ ");
			return sendReply('main', `**URL Path**\n${urlString}`)
		}).catch(e => {
			return sendReply('error', `Encountered an error while unshortening URLs: ${e}`)
		})

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};
