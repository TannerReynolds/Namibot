/* eslint-disable no-unused-vars */
const os = require('os');
const fs = require('fs');
const path = require('path');

const isSnowflake = id => /^\d+$/.test(id) && id.length >= 17 && id.length <= 19;
const isHexColor = color => /^#[0-9A-F]{6}$/i.test(color);
const isUrl = url => /^https?:\/\/[^\s$.?#].[^\s]*$/.test(url);

const fg = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	blue: '\x1b[44m',
};
const endColor = '\x1b[0m';

const completeFlag = process.argv.includes('--complete');

if (!completeFlag) {
	console.log(`${fg.blue}RUNNING SETUP VALIDATION SCRIPT${endColor}`);
	verifyInstall();
} else {
	console.log(`\n\n\n${fg.green}SETUP COMPLETED SUCCESSFULLY${endColor}`);
}

async function verifyInstall() {
	const platform = os.platform();
	const failures = [];
	let dbPath;
	if (platform === 'win32') {
		dbPath = path.join('C:', 'Program Files', 'PostgreSQL');
	} else if (platform === 'linux') {
		dbPath = '/usr/local/pgsql';
	} else {
		dbPath = false;
		failures.push('Not on an operating system with default PostgreSQL Path. Unable to verify installation.');
	}

	if (!dbPath || !fs.existsSync(dbPath)) {
		failures.push('Did not find PostgreSQL installation. Please verify that it is installed.');
	}

	try {
		let a = require('@lanred/discordjs-button-embed-pagination');
		let b = require('@prisma/client');
		let c = require('axios');
		let d = require('body-parser');
		let e = require('canvas');
		let f = require('confusables');
		let g = require('discord.js');
		let h = require('ejs');
		let i = require('express');
		let j = require('fs-extra');
		let k = require('helmet');
		let l = require('luxon');
		let m = require('sharp');
	} catch (e) {
		failures.push('did not find one or more required npm modules, please run "npm i" in your terminal to install necessary dependencies');
	}

	let config = false;
	try {
		config = require('./config.json');
	} catch (e) {
		failures.push('Could not find the config.js file. Please rename example.config.js to config.js and then ensure all information is correctly entered.');
	}

	if (config) {
		if (typeof config.token !== 'string' || config.token.length < 10) {
			failures.push('Token is not correctly entered. Please ensure it is a real token and that it is a string. Strings are encased in "');
		}

		const snowflakeProperties = ['clientId', 'guildId', 'botOwnerID'];
		for (const prop of snowflakeProperties) {
			if (!isSnowflake(config[prop])) {
				failures.push(`${prop} is not a snowflake. Snowflakes are strings of numbers that are used for Discord IDs. Example of a correct Snowflake: "1061175459112550490"`);
			}
		}

		for (const color in config.colors) {
			if (!isHexColor(config.colors[color])) {
				failures.push('Please ensure that your colors are all proper hex color codes. A hex color code entry should look like this: "#ff4d6b"');
			}
		}

		if (typeof config.server.enabled !== 'boolean') {
			failures.push(
				'Please ensure that server.enabled is a boolean. A boolean is `true` or `false` without the backticks. They are not to be confused with strings and should not be encased in ". Example: enabled: true,'
			);
		}

		if (typeof config.server.port !== 'number' && config.server.enabled) {
			failures.push('Your server port should be a number. Unlike snowflakes, which are numbers encased in ", this type of number should not have any ". example: port: 1294');
		}

		if (!isUrl(config.server.url) && config.server.enabled) {
			failures.push('Your url is not detected to be an actual URL. Please ensure it is the full url to this application, including the protocol (https://)');
		}

		for (const guildId in config.guilds) {
			const guild = config.guilds[guildId];

			if (!isSnowflake(guildId) || !isUrl(guild.invite)) {
				failures.push('ensure your guild id is a snowflake. Example of a correct Snowflake: "1061175459112550490"');
			}

			const guildSnowflakeProps = ['guildID', 'mainLogChannelID', 'secondaryLogChannelID', 'botCommandsChannelID', 'mailChannelID', 'staffRoleID', 'muteRoleID'];
			for (const prop of guildSnowflakeProps) {
				if (!isSnowflake(guild[prop])) {
					failures.push(`Ensure that ${prop} is a proper Discord ID. Discord IDs are snowflakes. Example of a correct Snowflake: "1061175459112550490"`);
				}
			}

			for (const command in guild.commands) {
				if (typeof guild.commands[command] !== 'boolean') {
					failures.push(`The command '${command}' in guild '${guildId}' should be a boolean. Found: ${typeof guild.commands[command]}`);
				}
			}

			if (guild.features.antiAds.enabled && (!Array.isArray(guild.features.antiAds.allowedInvites) || !guild.features.antiAds.allowedInvites.every(isUrl))) {
				failures.push(
					'Your anti Ads allowedInvites array is either not of type array<String>, or it is not filled with full URLs. Please ensure each invite is the full URL and not just the domain and path. Example of correct allowedInvites array: "allowedInvites": ["https://discord.gg/cars", "https://discord.gg/learnjapanese"]'
				);
			}
		}
	}

	if (!fs.existsSync('../.env')) {
		failures.push('Did not find .env file. Please rename the provided "example.env" file to just ".env" and then fill out the information as necessary');
	}

	if (failures.length === 0) {
		return console.log(`${fg.green}VALIDATION PASSED ALL CHECKS${endColor}`);
	} else {
		let log = `VALIDATION DID NOT PASS ALL CHECKS:\n${failures.join('\n\n')}`;
		return console.log(`${fg.red}${log}${endColor}`);
	}
}
