const prisma = require('../../utils/prismaClient');
const { EmbedBuilder } = require('discord.js');
const c = require('../../config');
const { colors } = require('../../config');
const log = require('../../utils/log');

/**
 * Checks the account age of a member and takes appropriate actions if the account is too new.
 * @param {GuildMember} member - The member whose account age needs to be checked.
 * @returns {Promise<void>} - A promise that resolves once the account age check is complete.
 */
async function checkAccountAge(member) {
  log.debug('begin');
  let age = member.user.createdAt;
  let daysReq = c.guilds[member.guild.id].features.checkAccountAge.days;
  let today = new Date();
  let weekAgo = today.setDate(today.getDate() - daysReq);

  if (age > weekAgo) {
    await member
      .send(
        `Your account is newer than ${daysReq} days. Please do not attempt to rejoin this server until your account reaches ${daysReq} days old, or you may be considered a bot by our automated system and be banned.`
      )
      .catch(() => {
        // do nothing
      });
    member
      .kick(`Account is newer than ${daysReq} days.`)
      .then(() => {
        let logEmbed = new EmbedBuilder()
          .setColor(colors.main)
          .setTitle('Member Kicked')
          .addFields(
            { name: 'User', value: `${member.user.username} (${member.user.id})` },
            { name: 'Reason', value: `Account is newer than ${daysReq} days | Creation date: ${age}` },
            { name: 'Moderator', value: 'System' }
          )
          .setTimestamp();

        let logChannel = member.client.guilds.cache.get(member.guild.id).channels.cache.get(c.guilds[member.guild.id].mainLogChannelID);
        logChannel.send({
          embeds: [logEmbed],
          content: `<@${member.user.id}>`,
        });
      })
      .catch(e => {
        return log.error(e);
      });
    await prisma.failedJoin.create({
      data: {
        userID: member.user.id,
        guildId: member.guild.id,
      },
    });
    let count = await prisma.failedJoin.count({
      where: {
        userID: member.user.id,
        guildId: member.guild.id,
      },
    });
    if (count > 3) {
      await member
        .send(
          `You have been banned from ${member.guild.name} for \`Suspected bot account\`. The length of your ban is Eternity. If you want to appeal this ban, run the /appeal command and fill out the information! To run the /appeal command here in our DMs, you need to join the bot's server:\n${c.appealServer}`
        )
        .catch(() => {
          // do nothing
        });
      member.guild.bans
        .create(member.user.id, {
          deleteMessageSeconds: 60 * 60 * 24 * 7,
          reason: `Suspected bot account`,
        })
        .then(() => {
          let logEmbed = new EmbedBuilder()
            .setColor(colors.main)
            .setTitle('Member Banned')
            .setThumbnail(member.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) ? member.avatarURL({ extension: 'png', forceStatic: false, size: 1024 }) : member.defaultAvatarURL)
            .addFields({ name: 'User', value: member.user.id }, { name: 'Reason', value: `Suspected bot account` }, { name: 'Ban Duration', value: 'Eternity' }, { name: 'Moderator', value: 'System' })
            .setTimestamp();

          let logChannel = member.client.guilds.cache.get(member.guild.id).channels.cache.get(c.guilds[member.guild.id].mainLogChannelID);
          logChannel.send({
            embeds: [logEmbed],
            content: `<@${member.user.id}>`,
          });
        })
        .catch(e => {
          log.error(`Error on banning user automatically (newer than ${daysReq} days old):\n${e}`);
        });
    }
  }
  log.debug('end');
}

module.exports = { checkAccountAge };
