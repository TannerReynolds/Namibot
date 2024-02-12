const { colors } = require('../../config');
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const log = require('../../utils/log');
const prisma = require('../../utils/prismaClient')
const { getModChannels } = require('../../utils/getModChannels');

async function antiChannelNuke(channel, user) {
    if(!channel.guild) return;
    let targetMember = channel.guild.members.fetch(user.id);

    if(!targetMember) return;

    targetMember.kick(`ANTI NUKE DETECTION`)
    .then(() => {
        let logEmbed = new EmbedBuilder()
            .setColor(colors.main)
            .setTitle('Member/Staff Kicked Automatically By Anti Nuke')
            .addFields({ name: 'User', value: `<@${user.id}> (${user.id})` }, { name: 'Reason', value: 'Member triggered anti nuke protocol by deleting too many channels too quickly!' }, { name: 'Moderator', value: `System` })
            .setTimestamp();

        if (targetMember) {
            logEmbed.setThumbnail(
                targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) ? targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) : targetMember.defaultAvatarURL
            );
        }

        getModChannels(channel.client, channel.guild.id).main.send({
            embeds: [logEmbed],
            content: `<@${user.id}>`,
        });
    })
    .catch(e => {
        return log.error(`Error when attempting to kick suspected nuker: ${e}`);
    });

await prisma.warning.create({
    data: {
        userID: user.id,
        date: new Date(),
        guildId: channel.guild.id,
        reason: 'Member triggered anti nuke protocol by deleting too many channels too quickly!',
        moderator: `System`,
        type: 'KICK',
    },
});
}

async function channelDeletor(channel) {
    const fetchedLogs = await channel.guild.fetchAuditLogs({
		limit: 1,
		type: AuditLogEvent.ChannelDelete,
	});
	const delLog = fetchedLogs.entries.first();

    return delLog.executor;
}

module.exports = { antiChannelNuke, channelDeletor }