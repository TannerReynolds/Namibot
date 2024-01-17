const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const colors = require('../utils/embedColors.js');
const { botOwnerID } = require('../config.json');
const log = require('../utils/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('eval')
		.setDMPermission(false)
		.setDescription('Execute code')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option => option.setName('code').setDescription('Code to execute').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (interaction.user.id !== botOwnerID) {
			return interaction.editReply('Only the bot owner can run this command');
		}

		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			? interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			: interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

		const code = interaction.options.getString('code');
		try {
			let evaled = await eval(code);

			if (typeof evaled !== 'string') {
				evaled = require('util').inspect(evaled);
			}

			let responseEmbed = new EmbedBuilder()
				.setTimestamp()
				.setColor(colors.main)
				.setAuthor({ name: name, iconURL: aviURL })
				.addFields({ name: 'Executed Code', value: `\`\`\`js\n${code}\n\`\`\`` }, { name: 'Result', value: `\`\`\`xl\n${evaled}\n\`\`\`` });

			interaction.editReply({ embeds: [responseEmbed] });
		} catch (err) {
			let responseEmbed = new EmbedBuilder()
				.setTimestamp()
				.setColor(colors.error)
				.setAuthor({ name: name, iconURL: aviURL })
				.addFields({ name: 'Executed Code', value: `\`\`\`js\n${code}\n\`\`\`` }, { name: 'Result', value: `\`ERROR\` \`\`\`xl\n${err}\n\`\`\`` });
			interaction.editReply({ embeds: [responseEmbed] });
		}
	},
};
