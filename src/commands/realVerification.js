const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const { guilds, colors } = require('../config.json');
const { isStaff } = require('../utils/isStaff');
const log = require('../utils/log');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fsPromises = require('fs').promises;
const sharp = require('sharp');
registerFont('./img/Chicken Scratch.ttf', { family: 'Chicken Scratch' });

module.exports = {
	data: new SlashCommandBuilder()
		.setName('realverification')
		.setDMPermission(false)
		.setDescription('Make a real verification photo')
		.addAttachmentOption(option => option.setName('img').setDescription('Image to verify').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();

		log.debug('Getting command channel');
		let commandChannel = guilds[interaction.guild.id].botCommandsChannelID;
		log.debug(`Command channel: ${commandChannel}`);
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages) && interaction.channel.id !== commandChannel)
			return interaction.editReply({
				content: `You have to go to the <#${commandChannel}> channel to use this command`,
				ephemeral: true,
			});

		let img = await interaction.options.getAttachment('img');

		if (!img.width || img.width === null) {
			return sendReply('error', 'This attachment is not recognized as an image');
		}

		let incomingBuffer = false;
		try {
			incomingBuffer = await downloadImage(img.url);
		} catch (e) {
			return sendReply('error', `There was an error downloading this image: ${e}`);
		}

		if (!incomingBuffer) return sendReply('error', `There was an error downloading this image`);

		let verificationBuffer = false;
		try {
			verificationBuffer = await createVerifiedImage(incomingBuffer, interaction.user.username);
		} catch (e) {
			log.error(e);
			return sendReply('error', `There was an error creating this image: ${e}`);
		}

		if (!verificationBuffer) return sendReply('error', `There was an error creating this image`);

		let verificationEmbed = new EmbedBuilder();
		let bufferAttach = false;
		try {
			bufferAttach = new AttachmentBuilder(verificationBuffer, { name: 'verified.png' });
		} catch (e) {
			sendReply('error', `There was an error forming the buffer attachment: ${e}`);
		}
		verificationEmbed = verificationEmbed.setImage('attachment://verified.png').setColor(colors.main);
		interaction.editReply({ content: 'Image Generation completed', ephemeral: true });
		interaction.channel
			.send({
				embeds: [verificationEmbed],
				files: [bufferAttach],
			})
			.catch(e => {
				return sendReply('error', `There was an error sending the verification embed: ${e}`);
			});

		function sendReply(type, message) {
			let replyEmbed = new EmbedBuilder().setColor(colors[type]).setDescription(message).setTimestamp();
			interaction.editReply({ embeds: [replyEmbed] });
		}
	},
};

async function downloadImage(url) {
	try {
		const response = await axios.get(url, {
			responseType: 'arraybuffer',
		});
		const buffer = Buffer.from(response.data, 'binary');
		return buffer;
	} catch (error) {
		log.error('Error downloading image:', error);
		return error;
	}
}

async function createArm(name) {
	const noteBuf = await fsPromises.readFile('./img/paper.png');
	const armBuf = await fsPromises.readFile('./img/arm.png');
	let canvas = createCanvas(500, 500);
	let ctx = canvas.getContext('2d');

	let note = await loadImage(noteBuf);
	let arm = await loadImage(armBuf);
	ctx.drawImage(note, 0, 0, canvas.width, canvas.height);

	ctx.font = '16px "Chicken Scratch"';
	ctx.fillStyle = '#001e7e';
	ctx.textAlign = 'center';

	ctx.save();
	ctx.translate(160, 185);
	ctx.rotate((-20 * Math.PI) / 180);
	ctx.fillText('The Car Community', 0, 0);
	ctx.restore();

	ctx.font = '16px "Chicken Scratch"';
	ctx.fillStyle = '#001e7e';
	ctx.textAlign = 'center';

	ctx.save();
	ctx.translate(160, 220);
	ctx.rotate((-20 * Math.PI) / 180);
	ctx.fillText(name, 0, 0);
	ctx.restore();

	ctx.drawImage(arm, 0, 0, canvas.width, canvas.height);

	return canvas.toBuffer();
}

async function createVerifiedImage(backgroundBuffer, name) {
	try {
		backgroundBuffer = await sharp(backgroundBuffer).png().toBuffer();
	} catch (error) {
		log.error(`Error converting image buffer to PNG: ${error}`);
		throw error;
	}
	let backgroundImage = await loadImage(backgroundBuffer);
	let canvas = createCanvas(backgroundImage.width, backgroundImage.height);
	let ctx = canvas.getContext('2d');
	let overlayBuffer = false;

	try {
		overlayBuffer = await createArm(name);
	} catch (e) {
		log.error(`Problem opening verification image: ${e}`);
	}

	ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

	let overlayImage = await loadImage(overlayBuffer);
	let overlayWidth = overlayImage.width;
	let overlayHeight = overlayImage.height;

	let overallScale = backgroundImage.width > backgroundImage.height ? 0.8 : 0.5;

	let newHeight = canvas.height * overallScale;
	let scaleFactor = newHeight / overlayHeight;
	overlayHeight = newHeight;
	overlayWidth *= scaleFactor;

	let overlayX = canvas.width - overlayWidth;
	let overlayY = canvas.height - overlayHeight;

	ctx.drawImage(overlayImage, overlayX, overlayY, overlayWidth, overlayHeight);

	return canvas.toBuffer();
}
