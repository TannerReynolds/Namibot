const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { defineTarget } = require('../utils/defineTarget');
const { guilds, colors, emojis } = require('../config');
const { isStaff } = require('../utils/isStaff');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

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
				content: `${emojis.error} You have to go to the <#${commandChannel}> channel to use this command`,
				ephemeral: true,
			});

		log.debug(`Getting Target...`);
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			log.debug(`Target undefined`);
			return sendReply(interaction, 'error', 'This user does not exist');
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

		let avEmbed = new EmbedBuilder().setColor(colors.main).setImage(pfpURL);

		interaction.editReply({
			embeds: [avEmbed],
			fetchReply: false,
		});
	},
};
