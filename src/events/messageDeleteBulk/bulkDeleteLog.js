const ejs = require("ejs");
const { getModChannels } = require("../../utils/getModChannels");
const log = require("../../utils/log");
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { colors } = require("../../config.json");

/**
 * Writes a log file and sends an embed message when bulk messages are deleted.
 * @param {Array} messages - The array of deleted messages.
 * @param {Object} channel - The channel where the messages were deleted.
 * @param {Object} client - The Discord client object.
 * @returns {Promise<void>}
 */
async function bulkDeleteLog(messages, channel, client) {
  log.debug("begin");
  ejs.renderFile(
    `./server/views/bulkDelete.ejs`,
    {
      messages: messages.reverse(),
      client: client,
    },
    {},
    (_renderErr, str) => {
      let attach = new AttachmentBuilder(str, { name: "bulkDelete.html" });
      let deleteEmbed = new EmbedBuilder()
        .setTitle(`Bulk Messages Deleted`)
        .setColor(colors.main)
        .setTimestamp();
      getModChannels(client, channel.guild.id).secondary.send({
        embeds: [deleteEmbed],
        files: [attach],
      });
    },
  );
  log.debug("end");
}

module.exports = { bulkDeleteLog };
