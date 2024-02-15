const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { botOwnerID } = require('../config');
const log = require('../utils/log');
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const { version } = require('../../package.json');
const { sendReply } = require('../utils/sendReply');

module.exports = {
	data: new SlashCommandBuilder().setName('update').setDMPermission(false).setDescription('Update and restart the bot').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		if (interaction.user.id !== botOwnerID) {
			return interaction.editReply('Only the bot owner can run this command');
		}

		function checkForUpdates() {
			const currentVersion = version;
			const repoUrl = 'https://raw.githubusercontent.com/TannerReynolds/Discord-Moderation-Bot/master/package.json';
			fs.writeFileSync('../restart.js', `module.exports = { channel: "${interaction.channel.id}" }`);

			https
				.get(repoUrl, res => {
					let data = '';

					res.on('data', chunk => {
						data += chunk;
					});

					res.on('end', () => {
						try {
							const latestVersion = JSON.parse(data).version;
							if (latestVersion !== currentVersion) {
								sendReply(interaction, 'main', 'Update available. Updating...');
								updateApplication(latestVersion);
							} else {
								sendReply(interaction, 'main', 'No update available.');
							}
						} catch (e) {
							sendReply(interaction, 'error', `Error parsing response: ${e}`);
						}
					});
				})
				.on('error', e => {
					sendReply(interaction, 'error', `Error checking for updates: ${e}`);
				});
		}

		function updateApplication(latestVersion) {
			exec('git pull', (error, stdout, stderr) => {
				if (error) {
					sendReply(interaction, 'error', `Error occurred: ${error}`);
					return;
				}
				log.debug(`stdout: ${stdout}`);
				log.debug(`stderr: ${stderr}`);

				sendReply(interaction, 'main', `Application updated to version \`${latestVersion}\`. Exiting...`);
				process.exit();
			});
		}

		checkForUpdates();
	},
};
