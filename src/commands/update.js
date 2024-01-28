const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { botOwnerID, colors } = require('../config.json');
const log = require('../utils/log');
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const { version } = require('../../package.json');

module.exports = {
	data: new SlashCommandBuilder().setName('update').setDMPermission(false).setDescription('Update and restart the bot').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		await interaction.deferReply();
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
								sendReply('main', 'Update available. Updating...');
								updateApplication();
							} else {
								sendReply('main', 'No update available.');
							}
						} catch (e) {
							sendReply('error', `Error parsing response: ${e}`);
						}
					});
				})
				.on('error', e => {
					sendReply('error', `Error checking for updates: ${e}`);
				});
		}

		function updateApplication() {
			exec('git pull', (error, stdout, stderr) => {
				if (error) {
					sendReply('error', `Error occurred: ${error}`);
					return;
				}
				log.debug(`stdout: ${stdout}`);
				log.debug(`stderr: ${stderr}`);

				sendReply('main', `Application updated to version \`${latestVersion}\`. Exiting...`);
				process.exit();
			});
		}

		checkForUpdates();

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();

			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};
