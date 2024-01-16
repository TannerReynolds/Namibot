const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const colors = require('../utils/embedColors.js');
const axios = require('axios');
const { defineTarget } = require('../utils/defineTarget');
const { guilds } = require('../config.json');
const { isStaff } = require('../utils/isStaff');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('av')
		.setDMPermission(false)
		.setDescription("Get a member's Avatar")
		.addStringOption(option => option.setName('user').setDescription('The user to get the AV from').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();

		let commandChannel = guilds[interaction.guild.id].botCommandsChannelID;
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers) && interaction.channel.id !== commandChannel)
			return interaction.editReply({
				content: `You have to go to the <#${commandChannel}> channel to use this command`,
				ephemeral: true,
			});

		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			return sendReply('error', 'This user does not exist');
		}
		console.log(target);

		let targetUser = await interaction.client.users.cache.get(target);

		if (!targetUser) return interaction.editReply("Bot cannot access this user's data");

		let pfpURL = targetUser.avatarURL({ format: 'png', size: 1024, dynamic: false }).replace('webp', 'png');
		let pfpBuffer = await downloadImage(pfpURL);
		async function downloadImage(url) {
			try {
				const response = await axios.get(url, { responseType: 'arraybuffer' });
				const buffer = Buffer.from(response.data, 'binary');
				return buffer;
			} catch (error) {
				console.error('Error downloading image:', error);
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
