/* eslint-disable no-unused-vars */
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { botOwnerID, colors, emojis } = require('../config');
const log = require('../utils/log');
const prisma = require('../utils/prismaClient');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('exec')
		.setDMPermission(false)
		.setDescription('Execute shell commands')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option => option.setName('command').setDescription('Command to execute').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);
		if (interaction.user.id !== botOwnerID) {
			return interaction.editReply('Only the bot owner can run this command');
		}

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		const command = interaction.options.getString('command');
		try {
			exec(command, (error, stdout, stderr) => {
				if (error) {
					throw (`Could not run command: ${error}`)
				}
				if(typeof stdout !== 'string') {
					stdout = require('util').inspect(stdout);
					let responseEmbed = new EmbedBuilder()
				.setTimestamp()
				.setColor(colors.main)
				.setAuthor({ name: name, iconURL: aviURL })
				.addFields(
					{ name: 'Executed Command', value: `\`\`\`js\n${command}\n\`\`\`` },
					{ name: 'Result', value: `\`\`\`xl\n${stdout.length > 1000 ? `${stdout.substring(0, 1000)}...` : stdout.substring(0, 1000)}\n\`\`\`` }
				);

			interaction.editReply({ embeds: [responseEmbed] });
				}
			});
		} catch (err) {
			let responseEmbed = new EmbedBuilder()
				.setTimestamp()
				.setColor(colors.error)
				.setAuthor({ name: name, iconURL: aviURL })
				.addFields(
					{ name: 'Executed Command', value: `\`\`\`js\n${command}\n\`\`\`` },
					{ name: 'Result', value: `\`ERROR\` \`\`\`xl\n${err.length > 1000 ? `${err.substring(0, 1000)}...` : err.substring(0, 1000)}\n\`\`\`` }
				);
			interaction.channel.send({ embeds: [responseEmbed] });

			sendReply(interaction, 'main', `${emojis.success}  Interaction Complete`);
		}
	},
};
