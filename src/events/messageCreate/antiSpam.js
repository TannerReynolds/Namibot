const state = require("../../utils/sharedState");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { colors } = require("../../config.json");
const { getModChannels } = require("../../utils/getModChannels");
const log = require("../../utils/log");
const prisma = require("../../utils/prismaClient");

/**
 * Handles anti-spam measures for incoming messages.
 * @param {Message} message - The message object.
 * @returns {Promise<void>} - A promise that resolves once the anti-spam measures are handled.
 */
async function antiSpam(message) {
  try {
    log.debug("begin");
    if (!message.guild) return log.debug("end");
    const MAX_MENTIONS = 8;
    const MAX_NEWLINES = 65;

    const reasons = [];

    if (
      message.mentions.users.size + message.mentions.roles.size >
      MAX_MENTIONS
    ) {
      await timeoutUser(message, 10);
      reasons.push("mass mentioning users or roles");
    }

    if (message.content.split("\n").length > MAX_NEWLINES) {
      await timeoutUser(message, 10);
      reasons.push("spamming new lines");
    }

    let rapidMessaging = await checkRapidMessaging(message);
    if (rapidMessaging) {
      await timeoutUser(message, 10);
      reasons.push("rapid messaging (over 3 messages in 1 second)");
    }

    if (reasons.length > 0) {
      let replyEmbed = new EmbedBuilder()
        .setTitle(`You have been automatically timed out for 10 minutes.`)
        .setColor(colors.success)
        .setDescription(
          `Reason: hitting the spam filter by ${reasons.join(", ")}`,
        );
      message.reply({ embeds: [replyEmbed] }).then((r) => {
        setTimeout(() => {
          return r.delete();
        }, 5000);
      });

      let aviURL = message.client.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      })
        ? message.client.user.avatarURL({
            extension: "png",
            forceStatic: false,
            size: 1024,
          })
        : message.client.user.defaultAvatarURL;

      await prisma.warning
        .create({
          data: {
            userID: message.author.id,
            date: new Date(),
            guildId: message.guild.id,
            reason: `Hitting the spam filter by ${reasons.join(", ")}`,
            moderator: `System`,
            type: "TIMEOUT",
          },
        })
        .catch((e) => {
          log.error(`Error creating warning log: ${e}`);
        });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ban_${message.author.id}`)
          .setLabel("Ban User")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`kick_${message.author.id}`)
          .setLabel("Kick User")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`mute_${message.author.id}`)
          .setLabel("Mute User")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`warn_${message.author.id}`)
          .setLabel("Warn User")
          .setStyle(ButtonStyle.Danger),
      );
      let logEmbed = new EmbedBuilder()
        .setColor(colors.main)
        .setTitle("Member Timed Out Automatically")
        .addFields(
          {
            name: "User",
            value: `<@${message.author.id}> (${message.author.id})`,
          },
          {
            name: "Reason",
            value: `Hitting the spam filter by ${reasons.join(", ")}`,
          },
          { name: "Duration", value: "10 minutes" },
          { name: "Moderator", value: "System" },
        )
        .setAuthor({ name: message.client.user.username, iconURL: aviURL })
        .setTimestamp();

      getModChannels(message.client, message.guild.id)
        .main.send({
          embeds: [logEmbed],
          components: [row],
          content: `<@${message.author.id}>`,
        })
        .catch((e) => {
          log.error(`Could not send log message: ${e}`);
        });
    }
    log.debug("end");
  } catch (e) {
    log.error(`Error in antiSpam: ${e}`);
  }
}

/**
 * Timeout a user for a specified duration.
 * @param {Message} message - The message object.
 * @param {number} duration - The duration in minutes for which the user should be timed out.
 * @throws {Error} If an error occurs while timing out the user.
 */
async function timeoutUser(message, duration) {
  await message.member.timeout(duration * 60 * 1000, "Spamming");
}

/**
 * Checks if a user is sending messages too rapidly.
 * @param {Message} message - The message object.
 * @returns {boolean} - Returns true if the user is sending messages too rapidly, false otherwise.
 */
async function checkRapidMessaging(message) {
  try {
    const userID = message.author.id;
    const currentTimestamp = message.createdTimestamp;

    state.addMessageTimestamp(userID, currentTimestamp);

    const timestamps = state.getMessageTimestamps(userID);
    if (timestamps.length === 3) {
      const timeDiff = timestamps[2] - timestamps[0];
      const rapidTimeLimit = 1000;

      if (timeDiff <= rapidTimeLimit) {
        return true;
      }
    }
    return false;
  } catch (e) {
    log.error(`Error checking rapid messaging: ${e}`);
    return false;
  }
}

module.exports = { antiSpam };
