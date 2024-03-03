/* eslint-disable no-unused-vars */
const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { botOwnerID, colors, emojis } = require("../config");
const log = require("../utils/log");
const prisma = require("../utils/prismaClient");
const { sendReply } = require("../utils/sendReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("change")
    .setDMPermission(false)
    .setDescription("Change something about the bot's account")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option.setName("username").setDescription("new username"),
    )
    .addStringOption((option) =>
      option.setName("avatar-url").setDescription("URL to new avatar"),
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    sendReply(interaction, "main", `${emojis.loading}  Loading Interaction...`);
    if (interaction.user.id !== botOwnerID) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  You dont have the necessary permissions to complete this action`,
      );
    }

    let aviURL =
      interaction.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;
    let name = interaction.user.username;

    let uName;
    let avURL;
    try {
      uName = interaction.options.getString("username");
    } catch {
      uName = false;
    }
    try {
      avURL = interaction.options.getString("avatar-url");
    } catch {
      avURL = false;
    }
    if (uName) {
      await interaction.client.user.setUsername(uName);
    }
    if (avURL) {
      await interaction.client.user.setAvatar(avURL);
    }
    if (!uName && !avURL) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Nothing to change`,
      );
    } else {
      let changeEmbed = new EmbedBuilder()
        .setTitle(`Bot Account Updated`)
        .setColor(colors.success)
        .setDescription(
          `${emojis.success}  Successfully updated the bot account`,
        )
        .setTimestamp()
        .setAuthor({ name: name, iconURL: aviURL });
      interaction.channel.send({ embeds: [changeEmbed] });
      sendReply(
        interaction,
        "success",
        `${emojis.success}  Interaction Complete`,
      );
    }
  },
};
