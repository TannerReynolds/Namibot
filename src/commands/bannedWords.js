const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors } = require('../config.json');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder().setName('bannedwords').setDMPermission(false).setDescription("See our server's banned words"),
	async execute(interaction) {
		await interaction.deferReply();
		log.debug('Getting data from AutoMod');
		let autoMod = await interaction.guild.autoModerationRules;
		if (autoMod) {
			log.debug('found autoMod');
			await autoMod.fetch();
		}

		let bannedWordsRule = await autoMod.cache.find(a => a.name.toLowerCase() === 'banned words');

		if (!bannedWordsRule) {
			log.debug("didn't find any banned words autoMod");
			return sendReply('error', "Couldn't find any banned word filters in server AutoMod rules. Please ensure banned words filter is named `Banned Words`");
		}

		let bannedWords = bannedWordsRule.triggerMetadata.keywordFilter;
		if (!bannedWords) {
			log.debug("didn't find any banned words inside of the banned words rule");
			return sendReply('error', 'The banned words list is empty');
		}

		log.debug('Constructing banned words embed');

		let bwEmbed = new EmbedBuilder()
			.setColor(colors.main)
			.setTimestamp()
			.addFields({ name: `Banned Words For ${interaction.guild.name}`, value: `\`\`\`txt\n${bannedWords.join(', ')}\n\`\`\`` });

		log.debug('Sending user banned words DM');
		interaction.user.send({ embeds: [bwEmbed] }).catch(e => {
			log.debug(`Couldn't send user ${interaction.user.username} (${interaction.user.id}) banned words list`);
			return sendReply('error', 'I was not able to send you a DM');
		});

		let doneEmbed = new EmbedBuilder().setColor(colors.main).setDescription('Sent banned words list to your DMs!').setTimestamp();

		return interaction.editReply({ embeds: [doneEmbed] });
	},
};
