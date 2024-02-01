const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { guilds } = require('../config.json');
const { isStaff } = require('../utils/isStaff');
const { unshortenURL } = require('../utils/unshortenURL');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unshort')
		.setDMPermission(false)
		.setDescription('Unshorten a URL')
		.addStringOption(option => option.setName('url').setDescription('The URL to unshorten').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers) && interaction.channel.id !== guilds[interaction.guild.id].commandChannel)
			return sendReply(interaction, 'main', `You have to go to the <#${guilds[interaction.guild.id].commandChannel}> channel to use this command`);

		let url = interaction.options.getString('url');

		unshortenURL(url)
			.then(urls => {
				if (urls.length === 0) return sendReply(interaction, 'main', 'This does not appear to be a shortened URL');
				let formattedURLs = urls.map(url => `\`${url}\``);
				let urlString = formattedURLs.join(' ⇒ ');
				return sendReply(interaction, 'main', `**URL Path**\n${urlString}`);
			})
			.catch(e => {
				return sendReply(interaction, 'error', `Encountered an error while unshortening URLs: ${e}`);
			});
	},
};
