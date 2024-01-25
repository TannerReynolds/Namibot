const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const { guilds, colors } = require('../config.json');
const { isStaff } = require('../utils/isStaff');
const log = require('../utils/log');
const { createCanvas, loadImage } = require('canvas');
const fsPromises = require('fs').promises;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('realverification')
		.setDMPermission(false)
		.setDescription("Make a real verification photo")
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

		if(!img.width || img.width === null) {
			return sendReply('error', 'This attachment is not recognized as an image')
		}

		let incomingBuffer = false;
		try {
			incomingBuffer = await downloadImage(img.url)
		}
		catch(e) {
			return sendReply('error', `There was an error downloading this image: ${e}`)
		}

		if(!incomingBuffer) return sendReply('error', `There was an error downloading this image`)

		let verificationBuffer = false
		try {
			verificationBuffer = await createVerifiedImage(incomingBuffer)
		}
		catch(e) {
			log.error(e)
			return sendReply('error', `There was an error creating this image: ${e}`)
		}

		if(!verificationBuffer) return sendReply('error', `There was an error creating this image`)

		let verificationEmbed = new EmbedBuilder();
		let bufferAttach = false;
		try {
			bufferAttach = new AttachmentBuilder(verificationBuffer, { name: 'verified.png' });
		}
		catch(e) {
			sendReply('error', `There was an error forming the buffer attachment: ${e}`)
		}
		verificationEmbed = verificationEmbed.setImage('attachment://verified.png').setColor(colors.main);
		interaction.editReply({
			embeds: [verificationEmbed],
			files: [bufferAttach]
		}).catch(e => {
			return sendReply('error', `There was an error sending the verification embed: ${e}`)
		})

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
		return error
	}
} 

async function createVerifiedImage(backgroundBuffer) {
    const backgroundImage = await loadImage(backgroundBuffer);
    const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
    const ctx = canvas.getContext('2d');
	let overlayBuffer = false;

	try {
		overlayBuffer = await fsPromises.readFile('../img/verification.png');
	}
	catch(e) {
		log.error(`Problem opening verification image: ${e}`)
	}

    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    const overlayImage = await loadImage(overlayBuffer);
    let overlayWidth = overlayImage.width;
    let overlayHeight = overlayImage.height;

    if (overlayHeight > canvas.height * 0.33) {
        const scaleFactor = canvas.height * 0.33 / overlayHeight;
        overlayHeight = canvas.height * 0.33;
        overlayWidth *= scaleFactor;
    }

    const overlayX = canvas.width - overlayWidth;
    const overlayY = canvas.height - overlayHeight;

    ctx.drawImage(overlayImage, overlayX, overlayY, overlayWidth, overlayHeight);

    return canvas.toBuffer();
}