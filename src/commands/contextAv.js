const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { guilds, colors, emojis } = require('../config');
const log = require('../utils/log.js');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new ContextMenuCommandBuilder().setName('Get Avatar').setDMPermission(false).setType(ApplicationCommandType.User),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);

		log.debug('Getting command channel');
		let commandChannel = guilds[interaction.guild.id].botCommandsChannelID;
		log.debug(`Command channel: ${commandChannel}`);

		log.debug(`Getting Target...`);
		let targetUser = interaction.targetUser;
		if (targetUser === undefined) {
			log.debug(`Target undefined`);
			return sendReply(interaction, 'error', 'This user does not exist');
		}
		log.debug(`Target: ${targetUser}`);

		if (!targetUser) {
			log.debug(`Could not get target user`);
			return interaction.editReply("Bot cannot access this user's data");
		}

		log.debug(`Target user username: ${targetUser.username}`);
		log.debug(`Getting pfpURL...`);

		let pfpURL = targetUser.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) ? targetUser.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) : targetUser.defaultAvatarURL;
		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;
		// .setAuthor({ name: name, iconURL: aviURL });

		let avEmbed = new EmbedBuilder().setColor(colors.main).setImage(pfpURL).setAuthor({ name: name, iconURL: aviURL });
		interaction.editReply({
			embeds: [avEmbed],
			fetchReply: false,
		});
	},
};
