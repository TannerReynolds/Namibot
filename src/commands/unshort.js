const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { guilds, emojis } = require('../config');
const { isStaffCommand } = require('../utils/isStaff');
const { unshortenURL } = require('../utils/unshortenURL');
const { sendReply } = require('../utils/sendReply');
const log = require('../utils/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unshort')
		.setDMPermission(false)
		.setDescription('Unshorten a URL')
		.addStringOption(option => option.setName('url').setDescription('The URL to unshorten').setRequired(true)),
	async execute(interaction) {
		log.debug('begin');
		await interaction.deferReply({ ephemeral: true });
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);
		if (!isStaffCommand(this.data.name, interaction, interaction.member, PermissionFlagsBits.BanMembers) && interaction.channel.id !== guilds[interaction.guild.id].commandChannel)
			return sendReply(interaction, 'main', `${emojis.error}  You have to go to the <#${guilds[interaction.guild.id].commandChannel}> channel to use this command`);

		let url = interaction.options.getString('url');

		unshortenURL(url)
			.then(urls => {
				if (urls.length === 0) return sendReply(interaction, 'main', `${emojis.error}  This does not appear to be a shortened URL`);
				let formattedURLs = urls.map(url => `\`${url}\``);
				let urlString = formattedURLs.join(' ⇒ ');
				return sendReply(interaction, 'main', `**URL Path**\n${urlString}`);
			})
			.catch(e => {
				return sendReply(interaction, 'error', `${emojis.error}  Encountered an error while unshortening URLs: ${e}`);
			});
		log.debug('end');
	},
};
