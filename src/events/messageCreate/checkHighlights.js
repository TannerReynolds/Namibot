const log = require("../../utils/log")
const colors = require("../../utils/embedColors")

async function checkHighlights(message) {
    let highlights = await prisma.highlight.findMany({
        where: {
            guildId: message.guild.id
        },
    }).catch(e => {
        log.error(`Error finding highlights: ${e}`)
    });

    if(!highlights) return;

    for(let h of highlights) {
        let guildH = false;
        let userH = false;
        try {
            guildH = await client.guilds.cache.get(h.guildId);
            userH = await client.users.cache.get(h.userID);
        }
        catch (e) {
            log.error(`Couldn't get guild or user from Highlights: ${e}`)
        }
        if(!guildH || !userH) return;

        if(message.content.toLowerCase().includes(h.phrase)) {
            let aviURL = message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			? message.author.avatarURL({ extension: 'png', forceStatic: false, size: 1024 })
			: message.author.defaultAvatarURL;
		    let name = message.author.username;
            let hEmbed = new EmbedBuilder().setAuthor({ name: name, iconURL: aviURL }).setColor(colors.main).setTitle('Highlighter Alert').setDescription(`Found message containing phrase: \`${h.phrase}\`!`).addFields({ name: 'Message', value: message.content }).setTimestamp();
            userH.send({
                embeds: [hEmbed],
                content: `Jump to Message: ${message.url}`
            }).catch(e => {
                log.error(`Couldn't send user highlight DM: ${e}`)
            })
        }

    }
}

module.exports = { checkHighlights }