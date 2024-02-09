const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const log = require('../utils/log');
const { sendReply } = require('../utils/sendReply');
const { emojis, botOwnerID } = require('../config');

module.exports = {
	data: new SlashCommandBuilder().setName('reload').setDescription('Reloads all command files.'),
	async execute(interaction) {
		await interaction.deferReply();
		if (interaction.user.id !== botOwnerID) {
			return sendReply(interaction, 'main', `${emojis.error}  Only the bot owner can run this command!`);
		}
		const commandsPath = path.join(__dirname);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

		interaction.client.commands.clear();

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			delete require.cache[require.resolve(filePath)];

			try {
				const newCommand = require(filePath);
				interaction.client.commands.set(newCommand.data.name, newCommand);
				log.verbose(`Reloaded Command: ${newCommand.data.name}`);
			} catch (error) {
				log.error(`There was an error reloading the command ${filePath}:`, error);
				sendReply(interaction, 'main', `${emojis.error}  There was an error reloading the command ${filePath}. See console for error.`);
				continue;
			}
		}

		sendReply(interaction, 'main', `${emojis.success}  Successfully reloaded all commands!`);
	},
};
