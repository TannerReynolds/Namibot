const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors, emojis } = require('../config');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder().setName('bannedwords').setDMPermission(false).setDescription("See our server's banned words"),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		sendReply(interaction, 'main', `${emojis.loading}  Loading Interaction...`);

		let autoMod = await interaction.guild.autoModerationRules;
		if (autoMod) {
			await autoMod.fetch();
		}

		let bannedWordsRule = await autoMod.cache.find(a => a.name.toLowerCase() === 'banned words');

		if (!bannedWordsRule) {
			return sendReply(interaction, 'error', `${emojis.error}  Couldn't find any banned word filters in server AutoMod rules. Please ensure banned words filter is named \`Banned Words\``);
		}

		let bannedWords = bannedWordsRule.triggerMetadata.keywordFilter;
		if (!bannedWords) {
			return sendReply(interaction, 'error', `${emojis.error}  The banned words list is empty`);
		}

		let bwString = bannedWords.join(', ');
		if (bwString.length > 1024) {
			bwString = `${bwString.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
		}
		let bwEmbed = new EmbedBuilder()
			.setColor(colors.main)
			.setTimestamp()
			.addFields({ name: `Banned Words For ${interaction.guild.name}`, value: `\`\`\`txt\n${bwString}\n\`\`\`` });

		interaction.user.send({ embeds: [bwEmbed] }).catch(() => {
			return sendReply(interaction, 'error', `${emojis.error}  I was not able to send you a DM`);
		});

		let doneEmbed = new EmbedBuilder().setColor(colors.main).setDescription(`${emojis.success}  Sent banned words list to your DMs!`).setTimestamp();

		return interaction.editReply({ embeds: [doneEmbed] });
	},
};
