const { EmbedBuilder, ChannelType } = require("discord.js");
const prisma = require("../../utils/prismaClient.js");
const log = require("../../utils/log");
const { colors, emojis } = require("../../config.json");

/**
 * Handles the mod mail server functionality.
 *
 * @param {Message} message - The message object received in the mod mail channel.
 * @returns {Promise<void>} - A promise that resolves once the mod mail response is sent.
 */
async function modMailServer(message) {
  log.debug("begin server");
  if (message.channel.type !== ChannelType.PublicThread)
    return log.debug("end");
  if (message.author.bot) return log.debug("end");

  try {
    const postId = message.channel.id;

    const mailEntry = await prisma.mail.findFirst({
      where: { postID: postId },
    });

    if (!mailEntry) return log.debug("end");

    let aviURL =
      message.author.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || message.author.defaultAvatarURL;
    let mailEmbed = new EmbedBuilder()
      .setTitle(
        `Mod Mail Response From ${message.author.username} (${message.author.id})`,
      )
      .setColor(colors.main)
      .setDescription(`\`${message.content}\``)
      .setAuthor({ name: message.author.username, iconURL: aviURL });

    const user = await message.client.users
      .fetch(mailEntry.userID)
      .catch(() => null);
    if (!user) return log.debug("end");
    let files = false;
    if (message.attachments.size > 0) {
      files = [...message.attachments.values()];
    }

    let sendData;
    if (!files) {
      sendData = { embeds: [mailEmbed] };
    } else {
      sendData = { embeds: [mailEmbed], files: files };
    }
    user
      .send(sendData)
      .then(() => {
        message.react(emojis.sent);
      })
      .catch((e) => {
        message.reply(`${emojis.error}  Error sending message: ${e}`);
      });
    log.debug("end server");
  } catch (e) {
    log.error(`Error sending mod mail response (modmailServer): ${e}`);
  }
}

/**
 * Sends a mod mail response to the appropriate thread channel.
 * @param {Message} message - The message object representing the mod mail response.
 * @returns {Promise<void>} - A promise that resolves once the response is sent.
 */
async function modMailDM(message) {
  log.debug("begin DM");
  if (message.channel.type !== ChannelType.DM) return log.debug("end");
  if (message.author.bot) return log.debug("end");

  try {
    const mailEntries = await prisma.mail.findMany({
      where: { userID: message.author.id },
    });

    let aviURL =
      message.author.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || message.author.defaultAvatarURL;
    let mailEmbed = new EmbedBuilder()
      .setTitle(
        `Mod Mail Response From ${message.author.username} (${message.author.id})`,
      )
      .setColor(colors.main)
      .setDescription(`\`${message.content}\``)
      .setAuthor({ name: message.author.username, iconURL: aviURL });

    mailEntries.forEach(async (entry) => {
      const thread = await message.client.channels
        .fetch(entry.postID)
        .catch(() => null);
      if (thread && thread.type === ChannelType.PublicThread) {
        let files = false;
        if (message.attachments.size > 0) {
          files = [...message.attachments.values()];
        }

        let sendData;
        if (!files) {
          sendData = { embeds: [mailEmbed] };
        } else {
          sendData = { embeds: [mailEmbed], files: files };
        }
        thread
          .send(sendData)
          .then(() => {
            message.react(emojis.sent);
          })
          .catch((e) => {
            message.reply(`${emojis.error}  Error sending message: ${e}`);
          });
      }
    });
    log.debug("end DM");
  } catch (e) {
    log.error(`Error sending mod mail response (modmailDM): ${e}`);
  }
}

module.exports = { modMailServer, modMailDM };
