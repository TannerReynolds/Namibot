const { PermissionFlagsBits } = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const { guilds, emojis } = require("../config.json");
const { isStaffCommand } = require("../utils/isStaff");
const { unshortenURL } = require("../utils/unshortenURL");
const { sendReply } = require("../utils/sendReply");
const log = require("../utils/log");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userunshort")
    .setDMPermission(false)
    .setDescription("Unshorten a URL")
    .setIntegrationTypes(
      AppIntegrationType.GuildInstall,
      AppIntegrationType.UserInstall,
    )
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("The URL to unshorten")
        .setRequired(true),
    ),
  async execute(interaction) {
    log.debug("begin");
    await interaction.deferReply({ ephemeral: true });
    sendReply(interaction, "main", `${emojis.loading}  Loading Interaction...`);

    let url = interaction.options.getString("url");

    unshortenURL(url)
      .then((urls) => {
        if (urls.length === 0)
          return sendReply(
            interaction,
            "error",
            `${emojis.error}  This does not appear to be a shortened URL`,
          );
        let formattedURLs = urls.map((url) => `\`${url}\``);
        let urlString = formattedURLs.join(" ⇒ ");
        return sendReply(interaction, "success", `**URL Path**\n${urlString}`);
      })
      .catch((e) => {
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  Encountered an error while unshortening URLs: ${e}`,
        );
      });
    log.debug("end");
  },
};
