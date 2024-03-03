const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../../../utils/isStaff');
const prisma = require('../../../utils/prismaClient');
const { sendReply } = require('../../../utils/sendReply');
const { getModChannels } = require('../../../utils/getModChannels');
const { colors, emojis, guilds } = require('../../../config');
const log = require('../../../utils/log');



async function kickButton(interaction, args) {
	if (!isStaff(interaction, interaction.member, PermissionFlagsBits.KickMembers)) return;
	let target = args[1];
		let aviURL = interaction.user.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) || interaction.user.defaultAvatarURL;
		let name = interaction.user.username;

	let guildMember;
	try {
		guildMember = await interaction.guild.members.fetch(target);
	}
	catch(e) {
		guildMember = false;
	}
	
		guildMember.kick('')
}

module.exports = { kickButton };
