const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { defineTarget } = require('../utils/defineTarget');
const { guilds, colors, emojis } = require('../config');
const { isStaffCommand } = require('../utils/isStaff');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('av')
		.setDMPermission(false)
		.setDescription("Get a member's Avatar")
		.addStringOption(option => option.setName('user').setDescription('The user to get the AV from').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);
		let commandChannel = guilds[interaction.guild.id].botCommandsChannelID;
		if (!isStaffCommand(this.data.name, interaction, interaction.member, PermissionFlagsBits.BanMembers) && interaction.channel.id !== commandChannel)
			return interaction.editReply({
				content: `${emojis.error}  You have to go to the <#${commandChannel}> channel to use this command`,
				ephemeral: true,
			});

		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			return sendReply(interaction, 'error', 'This user does not exist');
		}

		let targetUser = await interaction.client.users.cache.get(target);

		if (!targetUser) {
			return interaction.editReply("Bot cannot access this user's data");
		}

		let pfpURL = targetUser.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) ? targetUser.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) : targetUser.defaultAvatarURL;
		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;
		// .setAuthor({ name: name, iconURL: aviURL });

		let avEmbed = new EmbedBuilder().setColor(colors.main).setImage(pfpURL).setAuthor({ name: name, iconURL: aviURL });

		await interaction.channel.send({
			embeds: [avEmbed],
		});
		return sendReply(interaction, 'main', `${emojis.success}  Interaction Complete`);
	},
};
