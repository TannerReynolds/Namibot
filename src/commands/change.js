const { EmbedBuilder } = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const { botOwnerID, colors, emojis } = require("../config");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");
const fetch = require("node-fetch");

async function urlToBase64(url) {
  const res = await fetch(url);
  const buffer = await res.buffer();
  const mime = res.headers.get("content-type");
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("change")
    .setDescription("Change the bot account profile")
    .setIntegrationTypes(AppIntegrationType.UserInstall)
    .addStringOption((o) =>
      o.setName("username").setDescription("New username"),
    )
    .addStringOption((o) =>
      o.setName("avatar-url").setDescription("URL to avatar"),
    )
    .addStringOption((o) =>
      o.setName("banner-url").setDescription("URL to banner"),
    )
    .addStringOption((o) =>
      o.setName("bio").setDescription("New bot bio"),
    ),

  async execute(interaction) {
    log.debug("begin");

    await interaction.deferReply({ ephemeral: true });

    await sendReply(
      interaction,
      "main",
      `${emojis.loading}  Loading Interaction...`,
    );

    if (interaction.user.id !== botOwnerID) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  You dont have the necessary permissions to complete this action`,
      );
    }

    const username = interaction.options.getString("username");
    const avatarURL = interaction.options.getString("avatar-url");
    const bannerURL = interaction.options.getString("banner-url");
    const bio = interaction.options.getString("bio");

    if (!username && !avatarURL && !bannerURL && !bio) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Nothing to change`,
      );
    }

    const payload = {};

    if (username) payload.username = username;

    if (avatarURL) {
      payload.avatar = await urlToBase64(avatarURL);
    }

    if (bannerURL) {
      payload.banner = await urlToBase64(bannerURL);
    }

    if (bio) payload.bio = bio;

    try {
      await fetch("https://discord.com/api/v10/users/@me", {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${interaction.client.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const avi =
        interaction.user.avatarURL({
          extension: "png",
          forceStatic: false,
          size: 1024,
        }) || interaction.user.defaultAvatarURL;

      const embed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle("Bot Account Updated")
        .setDescription(
          `${emojis.success}  Successfully updated the bot account`,
        )
        .setAuthor({ name: interaction.user.username, iconURL: avi })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      log.debug("end");
    } catch (err) {
      log.error(err);
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Failed to update the bot account`,
      );
    }
  },
};