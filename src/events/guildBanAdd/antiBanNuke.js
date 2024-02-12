const { colors } = require('../../config');
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const log = require('../../utils/log');
const prisma = require('../../utils/prismaClient')
const { getModChannels } = require('../../utils/getModChannels');

async function antiBanNuke(ban, user) {
    if(!ban.guild) return;
    if(user.id === ban.client.user.id) return;
    let targetMember = ban.guild.members.fetch(user.id);

    if(!targetMember) return;

    targetMember.kick(`ANTI NUKE DETECTION`)
    .then(() => {
        let logEmbed = new EmbedBuilder()
            .setColor(colors.main)
            .setTitle('Member/Staff Kicked Automatically By Anti Nuke')
            .addFields({ name: 'User', value: `<@${user.id}> (${user.id})` }, { name: 'Reason', value: 'Member triggered anti nuke protocol by banning too many members too quickly!' }, { name: 'Moderator', value: `System` })
            .setTimestamp();

        if (targetMember) {
            logEmbed.setThumbnail(
                targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) ? targetMember.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) : targetMember.defaultAvatarURL
            );
        }

        getModChannels(ban.client, ban.guild.id).main.send({
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
        guildId: ban.guild.id,
        reason: 'Member triggered anti nuke protocol by banning too many members too quickly!',
        moderator: `System`,
        type: 'KICK',
    },
});
}

async function getBanner(ban) {
    const fetchedLogs = await ban.guild.fetchAuditLogs({
		limit: 1,
		type: AuditLogEvent.MemberBanAdd,
	});
	const delLog = fetchedLogs.entries.first();

    return delLog.executor;
}

module.exports = { antiBanNuke, getBanner }