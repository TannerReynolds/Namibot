/* eslint-disable no-useless-escape */
const log = require("../../utils/log");
const { regexMatch } = require("../../utils/regex");
const inLineRegex =
  "](<?https?://(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)>?)";
const flag = "gi";
const urlRegex =
  "https?://(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)";
/**
 * Checks for inline URLs in a message and sends a reply if any are found.
 *
 * @param {Discord.Client} client - The Discord client object.
 * @param {string} content - The content of the message.
 * @param {Discord.Message} message - The message object.
 * @param {function} getModChannels - A function to get the moderation channels.
 * @returns {Promise<void>} - A promise that resolves once the check is complete.
 */
async function checkForInlineURLs(client, content, message, oldMessage) {
  try {
    log.debug("begin");
    if (!message.channel.guild) return log.debug("end");
    if (message.author.bot) return log.debug("end");

    if (oldMessage) {
      if (message.content === oldMessage.content) return log.debug("end");
    }
    if (await regexMatch(content, inLineRegex, flag)) {
      message.reply(
        `Inline/hidden URL detected. URLs found in message: ${await regexMatch(content, urlRegex, flag).join(", ")}`,
      );
    }
    log.debug("end");
  } catch (e) {
    log.error(`Error in hiddenLinkDetection: ${e}`);
  }
}

module.exports = { checkForInlineURLs };
