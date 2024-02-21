const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { guilds, colors, emojis } = require('../config');
const log = require('../utils/log.js');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new ContextMenuCommandBuilder().setName('Get Avatar').setDMPermission(false).setType(ApplicationCommandType.User),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);

		let commandChannel = guilds[interaction.guild.id].botCommandsChannelID;

		let targetUser = interaction.targetUser;
		if (targetUser === undefined) {
			return sendReply(interaction, 'error', 'This user does not exist');
		}

		if (!targetUser) {
			return interaction.editReply("Bot cannot access this user's data");
		}

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
