const { sendReply } = require('../../../utils/sendReply');
const { colors, emojis } = require('../../../config');
const { EmbedBuilder } = require('discord.js');
const prisma = require('../../../utils/prismaClient');
const { getModChannels } = require('../../../utils/getModChannels');

async function unbanButtonDeny(interaction, args) {
	sendReply(interaction, 'main', `${emojis.loading}  Processing...`);
}

module.exports = { unbanButtonDeny };
