const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const { defineTarget } = require('../utils/defineTarget');
const { defineDurationString } = require('../utils/defineDuration');
const fs = require('fs');
const { spawnSync } = require('child_process');
const axios = require('axios');
const path = require('path');
const { isStaff } = require('../utils/isStaff');
const colors = require('../utils/embedColors');
const log = require('../utils/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bam')
		.setDMPermission(false)
		.setDescription('Bam a user from the server using either a mention or an id')
		.addStringOption(option => option.setName('user').setDescription('The user to bam.').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('The reason for bamming this user').setRequired(true))
		.addStringOption(option => option.setName('duration').setDescription('The amount of time to bam this user for ("forever" for permanent)').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		if (!isStaff(interaction, interaction.member, PermissionFlagsBits.ManageMessages)) return sendReply('main', "You're not a moderator, idiot");
		let target = await defineTarget(interaction, 'edit');
		if (target === undefined) {
			return sendReply('error', 'This user does not exist');
		}

		let targetMember = await interaction.guild.members.fetch(target);

		let durationString = await defineDurationString(interaction);

		let tpfpName = `pfp${target}.png`;
		let tpfp = targetMember.user
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
