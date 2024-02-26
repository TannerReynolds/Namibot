const fs = require('fs').promises;
const path = require('path');
const toml = require('toml');
const _ = require('lodash');

let guildsPath = path.join(__dirname, 'guilds');
let configPath = path.join(__dirname, 'bot.toml');
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
				if (!file.endsWith('.toml')) continue; // Skip non-TOML files
				if (file.includes('blank.toml')) continue; // Skip non-TOML files

				const filePath = path.join(guildsPath, file);
				const content = await fs.readFile(filePath, 'utf8');
				const parsedContent = toml.parse(content); // Parse the TOML content

				// Assume the file name (without extension) represents the guild ID
				const guildID = parsedContent.guildID;
				guildObjects[guildID] = parsedContent; // Assign parsed content to guild ID
			}
		} catch (error) {
			console.error('Error creating guild objects:', error);
		}
	}

	// Load the main configuration and merge guild configurations
	async function createConfigRoot() {
		try {
			const mainFile = await fs.readFile(configPath, 'utf-8');
			const parsedMainFile = toml.parse(mainFile); // Parse the main config TOML file
			config = _.merge(config, parsedMainFile); // Merge the main config into the config object

			// Directly assign the loaded guildObjects to config.guilds
			config.guilds = guildObjects;
			console.log(guildObjects);

			let passedSnowflakeCheck = await verifySnowflakes(config);
			if (!passedSnowflakeCheck) {
				return console.error('Snowflake check failed. Please check your config and try again.');
			}

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

async function verifySnowflakes(configObj) {
	const snowflakeProperties = ['token', 'clientId', 'botOwnerID', 'guildId'];
	const snowFlakeGuildProps = ['guildID', 'mainLogChannelID', 'secondaryLogChannelID', 'botCommandsChannelID', 'mailChannelID', 'staffRoleID', 'voiceModRoleID', 'muteRoleID'];
	const snowFlakeGuildallowedChannelProps = ['allowedChannels'];
	const snowFlakeGuildAutoRoleProps = ['roles'];

	let passed = true;

	for (const prop of snowflakeProperties) {
		if (!isSnowflake(configObj[prop])) {
			console.log(`${prop} is not a valid Snowflake. Snowflakes or IDs are 16-21 digits long, and are strings NOT NUMBERS. This means they need to be wrapped in quotes.`);
			passed = false;
		}
	}

	for (const guild in configObj.guilds) {
		for (const prop of snowFlakeGuildProps) {
			if (!isSnowflake(guild[prop])) {
				console.log(`${prop} is not a valid Snowflake. Snowflakes or IDs are 16-21 digits long, and are strings NOT NUMBERS. This means they need to be wrapped in quotes.`);
				passed = false;
			}
		}
		if (guild.features.gifDetector.enabled) {
			if (!Array.isArray(guild.features.gifDetector.allowedChannels)) {
				console.log('allowedChannels is not an array');
				passed = false;
			}
			for (const prop of snowFlakeGuildallowedChannelProps) {
				if (guild.features.gifDetector.allowedChannels.some(channel => !isSnowflake(channel))) {
					console.log(`${prop} is not a valid array of Snowflakes. Snowflakes or IDs are 16-21 digits long, and are strings NOT NUMBERS. This means they need to be wrapped in quotes.`);
					passed = false;
				}
			}
		}
		if (guild.features.autoRole.enabled) {
			if (!Array.isArray(guild.features.autoRole.roles)) {
				console.log('roles in your Autorole config is not an array');
				passed = false;
			}
			for (const prop of snowFlakeGuildAutoRoleProps) {
				if (guild.features.autoRole.roles.some(role => !isSnowflake(role))) {
					console.log(`${prop} is not a valid array of Snowflakes. Snowflakes or IDs are 16-21 digits long, and are strings NOT NUMBERS. This means they need to be wrapped in quotes.`);
					passed = false;
				}
			}
		}
	}

	return passed;
}

async function isSnowflake(string) {
	return /^[0-9]{16,21}$/.test(string);
}
