const fs = require('fs').promises;
const path = require('path');
const toml = require('toml');
const _ = require('lodash');

let guildsPath = path.join(__dirname, 'guilds');
let exportPath = path.join(__dirname, '..', 'config.json');

createConfig();

async function createConfig() {
	let config = {};
	let guildObjects = {};

	// Load guild configurations
	async function getGuilds() {
		try {
			const files = await fs.readdir(guildsPath);
			for (const file of files) {
				if (!file.endsWith('.toml')) continue;
				if (file.includes('blank.toml')) continue;

				const filePath = path.join(guildsPath, file);
				const content = await fs.readFile(filePath, 'utf8');
				const parsedContent = toml.parse(content);

				const guildID = parsedContent.guildID;
				guildObjects[guildID] = parsedContent;
			}
		} catch (error) {
			console.error('Error creating guild objects:', error);
		}
	}

	// Load the main configuration and merge guild configurations
	async function createConfigRoot() {
			try {
			let botdev = path.join(__dirname, 'botdev.toml')
			let bot = path.join(__dirname, 'bot.toml')
			let mainFile;
			try {
				mainFile = await fs.readFile(botdev, 'utf-8')
			} catch (e) {
				mainFile = await fs.readFile(bot, 'utf-8')
			}
			const parsedMainFile = toml.parse(mainFile); // Parse the main config TOML file
			config = _.merge(config, parsedMainFile); // Merge the main config into the config object

			// Directly assign the loaded guildObjects to config.guilds
			config.guilds = guildObjects;
			console.log(guildObjects);

			/*
			let passedSnowflakeCheck = await verifySnowflakes(config);
			if (!passedSnowflakeCheck) {
				return console.error('Snowflake check failed. Please check your config and try again.');
			}
			*/

			// Save the final configuration as JSON
			const jsonConfig = JSON.stringify(config, null, 4);
			await fs.writeFile(exportPath, jsonConfig, 'utf-8');
			console.log('Config created successfully');
		} catch (e) {
			console.error('Error creating main config:', e);
		}
	}

	await getGuilds();
	await createConfigRoot();
}
