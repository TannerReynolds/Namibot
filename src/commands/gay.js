const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const { createCanvas, Image } = require('canvas');
const axios = require('axios');
const { guilds } = require('../config.json');
const { isStaff } = require('../utils/isStaff');

module.exports = {
	data: new SlashCommandBuilder().setDMPermission(false).setName('gay').setDescription('Make your pfp gay'),
	async execute(interaction) {
		await interaction.deferReply();
		let commandChannel = guilds[interaction.guild.id].botCommandsChannelID;
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers) && interaction.channel.id !== commandChannel)
			return interaction.editReply({
				content: `You have to go to the <#${commandChannel}> channel to use this command`,
				ephemeral: true,
			});
		let pfpURL = interaction.user.displayAvatarURL({ format: 'png', size: 1024, dynamic: false }).replace('webp', 'png');
		let pfpBuffer = await downloadImage(pfpURL);
		async function downloadImage(url) {
			try {
				const response = await axios.get(url, { responseType: 'arraybuffer' });
				const buffer = Buffer.from(response.data, 'binary');
				return buffer;
			} catch (error) {
				console.error('Error downloading image:', error);
			}
		}
		overlayImage(pfpBuffer, '.\\img\\gay.png', 0.4).then(r => {
			let gayEmbed = new EmbedBuilder();
			let bufferAttach = new AttachmentBuilder(r, { name: 'gay.png' });
			gayEmbed = gayEmbed.setImage('attachment://gay.png');
			interaction.editReply({
				embeds: [gayEmbed],
				files: [bufferAttach],
				fetchReply: false,
			});
		});

		function overlayImage(baseImageBuffer, overlayPath, opacity = 0.4) {
			return new Promise((resolve, reject) => {
				let baseImg = new Image();
				baseImg.onload = () => {
					let canvas = createCanvas(baseImg.width, baseImg.height);
					let ctx = canvas.getContext('2d');

					ctx.drawImage(baseImg, 0, 0, baseImg.width, baseImg.height);

					fs.readFile(overlayPath, (err, overlayImageBuffer) => {
						if (err) {
							reject(err);
							return;
						}

						let overlayImg = new Image();
						overlayImg.onload = () => {
							ctx.globalAlpha = opacity;
							ctx.drawImage(overlayImg, 0, 0, baseImg.width, baseImg.height);
							ctx.globalAlpha = 1.0;

							let resultBuffer = canvas.toBuffer();
							resolve(resultBuffer);
						};
						overlayImg.onerror = err => reject(err);
						overlayImg.src = overlayImageBuffer;
					});
				};
				baseImg.onerror = err => reject(err);
				baseImg.src = baseImageBuffer;
			});
		}
	},
};
