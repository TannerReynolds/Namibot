const { colors } = require("../../config.json");
const { EmbedBuilder } = require("discord.js");
const log = require("../../utils/log");
const { getModChannels } = require("../../utils/getModChannels");

async function interactionLog(interaction) {
  log.debug("begin");
  let aviURL =
    interaction.user.avatarURL({
      extension: "png",
      forceStatic: false,
      size: 1024,
    }) || interaction.user.defaultAvatarURL;
  let name = interaction.user.username;

  let logEmbed = new EmbedBuilder();
  try {
    logEmbed
      .setColor(colors.main)
      .setTitle("Command Ran")
      .addFields(
        {
          name: "User",
          value: `${interaction.user.username} (${interaction.user.id})`,
        },
        { name: "Command", value: interaction.commandName },
      )
      .setAuthor({ name: name, iconURL: aviURL })
      .setTimestamp();
  } catch (e) {
    log.error(`Error forming the interaction log embed: ${e}`);
  }

  log.debug("end");
  return getModChannels(interaction.client, interaction.guild.id)
    .secondary.send({
      embeds: [logEmbed],
      content: `${interaction.user.username} (${interaction.user.id})`,
    })
    .catch((e) => {
      log.error(
        `Error sending interaction log to guild secondary log channel: ${e}`,
      );
    });
}

module.exports = { interactionLog };
