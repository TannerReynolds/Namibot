const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const { guilds, colors } = require('../config.json');
const { isStaff } = require('../utils/isStaff.js');
const log = require('../utils/log.js');

module.exports = {
	data: new ContextMenuCommandBuilder().setName('Get Avatar').setDMPermission(false).setType(ApplicationCommandType.User),
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
		let targetUser = interaction.targetUser;
		if (targetUser === undefined) {
			log.debug(`Target undefined`);
			return sendReply('error', 'This user does not exist');
		}
		log.debug(`Target: ${targetUser}`);

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
