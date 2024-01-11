const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const { parseNewDate, durationToString, isValidDuration } = require('../utils/parseDuration.js');
const fs = require('fs');
const { spawnSync } = require('child_process');
const axios = require('axios');
const path = require('path');
const { isStaff } = require('../utils/isStaff');
const colors = require('../utils/embedColors');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bam')
		.setDescription('Bam a user from the server using either a mention or an id')
		.addUserOption(option => option.setName('user').setDescription('The user to bam.').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('The reason for bamming this user').setRequired(true))
		.addStringOption(option => option.setName('duration').setDescription('The amount of time to bam this user for')),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers))
			return interaction.editReply({
				content: "You're not staff, idiot",
				ephemeral: true,
			});
		let target = interaction.options.getUser('user');

		let duration;
		let durationString = 'eternity';
		if (!interaction.options.getString('duration')) {
			duration = 'infinite';
		} else {
			let rawDuration = interaction.options.getString('duration');
			if (await isValidDuration(rawDuration)) {
				duration = await parseNewDate(rawDuration);
				durationString = await durationToString(rawDuration);
			} else {
				duration = 'infinite';
			}
		}

		let tpfpName = `pfp${target.id}.png`;
		let tpfp = target
			.displayAvatarURL({
				format: 'png',
				size: 16,
				dynamic: false,
			})
			.replace('webp', 'png')
			.replace('size=16', 'size=96');
		let pfpBuffer = await downloadImage(tpfp);
		await saveBuffer(pfpBuffer, tpfpName);

		const pythonScriptPath = path.resolve(__dirname, 'bam.py');
		const pythonScript = spawnSync('python', [pythonScriptPath, tpfpName]);

		if (pythonScript.error) {
			console.error('Error executing Python script:', pythonScript.error);
			return;
		}

		const filePath = pythonScript.stdout.toString().trim();

		const bammedBuffer = fs.readFileSync(filePath);

		fs.unlinkSync(filePath);
		fs.unlinkSync(tpfpName);

		let reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : 'no reason provided';

		let aviURL = interaction.user
			.avatarURL({
				format: 'png',
				dynamic: false,
			})
			.replace('webp', 'png');
		let name = interaction.user.username;

		let banEmbed = new EmbedBuilder()
			.setColor(colors.main)
			.setTimestamp()
			.setTitle(`User Bammed`)
			.setDescription(`Successfully bammed <@${target}> for ${durationString}. Reason: ${reason}`)
			.setAuthor({
				name: name,
				iconURL: aviURL,
			});

		bufferAttach = new AttachmentBuilder(bammedBuffer, {
			name: 'bam.gif',
		});
		banEmbed.setImage('attachment://bam.gif');
		interaction.editReply({
			embeds: [banEmbed],
			files: [bufferAttach],
		});
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
		console.error('Error downloading image:', error);
	}
}

async function saveBuffer(buf, name) {
	fs.writeFileSync(`${name}`, buf);
}
