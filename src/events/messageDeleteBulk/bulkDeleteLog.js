const ejs = require("ejs");
const fs = require("fs-extra");
const { getModChannels } = require("../../utils/getModChannels");
const log = require("../../utils/log");
const { EmbedBuilder, MessageAttachment } = require("discord.js");
const { colors, server } = require("../../config");

/**
 * Writes a log file and sends an embed message when bulk messages are deleted.
 * @param {Array} messages - The array of deleted messages.
 * @param {Object} channel - The channel where the messages were deleted.
 * @param {Object} client - The Discord client object.
 * @returns {Promise<void>}
 */
async function bulkDeleteLog(messages, channel, client) {
  log.debug("begin");
  let fileName = `bdl${randomToken(8)}`;
  const stream = fs.createWriteStream(`./server/public/${fileName}.html`);
  stream.once("open", () => {
    ejs.renderFile(
      `./server/views/bulkDelete.ejs`,
      {
        messages: messages.reverse(),
        client: client,
      },
      {},
      (_renderErr, str) => {
        stream.write(str);
      },
    );
    stream.end();
    let deleteEmbed = false;
    /*
		if (server.enabled) {
			deleteEmbed = new EmbedBuilder()
				.setTitle(`Bulk Messages Deleted`)
				.setColor(colors.main)
				.addFields({ name: 'Deleted Messages', value: `${server.url}/${fileName}` })
				.setTimestamp();
			getModChannels(client, channel.guild.id).secondary.send({
				embeds: [deleteEmbed],
			});
		} else {
		*/
    let attach = new MessageAttachment(`./server/public/${fileName}.html`);
    deleteEmbed = new EmbedBuilder()
      .setTitle(`Bulk Messages Deleted`)
      .setColor(colors.main)
      .setTimestamp();
    getModChannels(client, channel.guild.id)
      .secondary.send({
        embeds: [deleteEmbed],
        files: [attach],
      })
      .then(() => {
        fs.unlink(`./server/public/${fileName}.html`, (err) => {
          if (err) throw err;
        });
      });
    //	}
  });
  log.debug("end");
}

module.exports = { bulkDeleteLog };

/**
 * Generates a random token of specified length.
 * @param {number} number - The length of the token.
 * @param {boolean} symbols - Whether to include symbols in the token.
 * @returns {string} - The randomly generated token.
 */
function randomToken(number, symbols) {
  number = parseInt(number, 10);
  let text = "";
  let possible;
  if (symbols !== true) {
    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  } else {
    possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()-_=+[]{}|;:/?><,.";
  }
  for (let i = 0; i < number; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
