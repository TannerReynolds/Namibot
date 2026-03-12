const { EmbedBuilder } = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const axios = require("axios");
const { botOwnerID, colors, emojis } = require("../config");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");

async function urlToBase64(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });

  const mime = response.headers["content-type"] || "image/png";
  const buffer = Buffer.from(response.data);

  return `data:${mime};base64,${buffer.toString("base64")}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("change")
    .setDescription("Change the bot account profile")
    .setDMPermission(false)
    .setIntegrationTypes(AppIntegrationType.UserInstall)
    .addStringOption((option) =>
      option.setName("username").setDescription("New username"),
    )
    .addStringOption((option) =>
      option.setName("avatar-url").setDescription("URL to a new avatar image"),
    )
    .addStringOption((option) =>
      option.setName("banner-url").setDescription("URL to a new banner image"),
    )
    .addStringOption((option) =>
      option.setName("bio").setDescription("New bot bio"),
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

    try {
      if (username) {
        payload.username = username;
      }

      if (avatarURL) {
        payload.avatar = await urlToBase64(avatarURL);
      }

      if (bannerURL) {
        payload.banner = await urlToBase64(bannerURL);
      }

      if (bio) {
        payload.bio = bio;
      }

      await axios.patch("https://discord.com/api/v10/users/@me", payload, {
        headers: {
          Authorization: `Bot ${interaction.client.token}`,
          "Content-Type": "application/json",
        },
      });

      const requesterAvatar =
        interaction.user.avatarURL({
          extension: "png",
          forceStatic: false,
          size: 1024,
        }) || interaction.user.defaultAvatarURL;

      const updatedFields = [];

      if (username) updatedFields.push(`Username: \`${username}\``);
      if (avatarURL) updatedFields.push("Avatar updated");
      if (bannerURL) updatedFields.push("Banner updated");
      if (bio) updatedFields.push("Bio updated");

      const changeEmbed = new EmbedBuilder()
        .setTitle("Bot Account Updated")
        .setColor(colors.success)
        .setDescription(
          `${emojis.success}  Successfully updated the bot account\n\n${updatedFields.join("\n")}`,
        )
        .setTimestamp()
        .setAuthor({
          name: interaction.user.username,
          iconURL: requesterAvatar,
        });

      await interaction.editReply({
        content: "",
        embeds: [changeEmbed],
      });

      log.debug("end");
    } catch (error) {
      log.error(error?.response?.data || error);
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Failed to update the bot account`,
      );
    }
  },
};