const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const colors = require('../utils/embedColors.js');
const axios = require('axios');
const { defineTarget } = require('../utils/defineTarget');
const { guilds } = require('../config.json');
const { isStaff } = require('../utils/isStaff');
const log = require('../utils/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('av')
		.setDMPermission(false)
		.setDescription("Get a member's Avatar")
		.addStringOption(option => option.setName('user').setDescription('The user to get the AV from').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();

		log.debug('Getting command channel');
		let commandChannel = guilds[interaction.guild.id].botCommandsChannelID;
		log.debug(`Command channel: ${commandChannel}`);
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers) && interaction.channel.id !== commandChannel)
			return interaction.editReply({
				content: `You have to go to the <#${commandChannel}> channel to use this command`,
				ephemeral: true,
			});

		log.debug(`Getting Target...`);
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			log.debug(`Target undefined`);
			return sendReply('error', 'This user does not exist');
		}
		log.debug(`Target: ${target}`);

		log.debug(`Getting Target User`);
		let targetUser = await interaction.client.users.cache.get(target);

		if (!targetUser) {
			log.debug(`Could not get target user`);
			return interaction.editReply("Bot cannot access this user's data");
		}

		log.debug(`Target user username: ${targetUser.username}`);
		log.debug(`Getting pfpURL...`);

		let pfpURL = targetUser.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) ? targetUser.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) : targetUser.defaultAvatarURL;
		log.debug(`Downloading pfp URL: ${pfpURL}`);
		let pfpBuffer = await downloadImage(pfpURL);
		async function downloadImage(url) {
			try {
				const response = await axios.get(url, { responseType: 'arraybuffer' });
				const buffer = Buffer.from(response.data, 'binary');
				log.debug(`Got buffer`);
				return buffer;
			} catch (error) {
				log.error(`Error downloading image: ${error}`);
			}
		}

		let avEmbed = new EmbedBuilder();
		bufferAttach = new AttachmentBuilder(pfpBuffer, { name: 'av.png' });
		avEmbed.setColor(colors.main);
		avEmbed = avEmbed.setImage('attachment://av.png');
		interaction.editReply({
			embeds: [avEmbed],
			files: [bufferAttach],
			fetchReply: false,
		});
	},
};
