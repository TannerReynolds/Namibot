const log = require("../../utils/log");
const { colors } = require("../../config.json");
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const state = require("../../utils/sharedState");
const highlightsCache = require("../../utils/highlightsCache");

/**
 * Checks for highlights in a message and sends a notification to the user if a highlight is found.
 * @param {Message} message - The message object to check for highlights.
 * @returns {Promise<void>}
 */
async function checkHighlights(message) {
  log.debug("begin");
  if (message.author.bot || !message.guild.id) return log.debug("end");

  try {
    const highlights = highlightsCache.get(message.guild.id);
    if (!highlights || highlights.length === 0) return log.debug("end");

    const dmPromises = [];

    for (const h of highlights) {
      let regPhrase = new RegExp(`\\b${h.phrase}\\b`);
      if (
        regPhrase.test(message.content.toLowerCase()) &&
        message.author.id !== h.userID
      ) {
        let isCooldown;
        try {
          isCooldown = await state.getHLCoolDown();
        } catch (e) {
          continue;
        }
        if (!isCooldown.has(h.userID)) {
          let recipient;
          try {
            recipient = await message.guild.members.cache.get(h.userID);
          } catch (e) {
            continue;
          }

          let permissions;
          try {
            permissions = message.channel.permissionsFor(recipient);
          } catch (e) {
            continue;
          }

          if (!permissions.has(PermissionFlagsBits.ViewChannel)) {
            continue;
          }

          await state.addHLCoolDown(h.userID);

          const aviURL =
            message.author.avatarURL({
              extension: "png",
              forceStatic: false,
              size: 1024,
            }) || message.author.defaultAvatarURL;
          const name = message.author.username;
          let postedContent = message.content;
          if (message.content.length > 1024) {
            postedContent = `${message.content.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
          }
          const hEmbed = new EmbedBuilder()
            .setAuthor({ name: name, iconURL: aviURL })
            .setColor(colors.main)
            .setTitle("Highlighter Alert")
            .setDescription(`Found message containing phrase: \`${h.phrase}\`!`)
            .addFields(
              { name: "Message", value: postedContent },
              { name: "Channel", value: `<#${message.channel.id}>` },
            )
            .setTimestamp();

          dmPromises.push(
            recipient
              ?.send({
                embeds: [hEmbed],
                content: `Jump to Message: ${message.url}`,
              })
              .catch((e) =>
                log.error(`Couldn't send highlight DM to ${h.userID}: ${e}`),
              ),
          );
        }
      }
    }

    await Promise.allSettled(dmPromises);
    log.debug("end");
  } catch (e) {
    log.error(`Error checking highlights: ${e}`);
  }
}

module.exports = { checkHighlights };
