const { EmbedBuilder } = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const prisma = require("../utils/prismaClient.js");
const { colors, emojis } = require("../config.json");
const { sendReply } = require("../utils/sendReply");
const log = require("../utils/log");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userdeltag")
    .setDMPermission(false)
    .setDescription("Delete one of your personal tags")
    .setIntegrationTypes(AppIntegrationType.UserInstall)
    .addStringOption((option) =>
      option
        .setName("tag-id")
        .setDescription("The ID of the tag to delete")
        .setRequired(true),
    ),

  async execute(interaction) {
    log.debug("begin");

    await interaction.deferReply({ ephemeral: true });

    await sendReply(
      interaction,
      "main",
      `${emojis.loading}  Loading Interaction...`,
    );

    const tagID = interaction.options.getString("tag-id");

    if (!tagID) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  No tag ID provided!`,
      );
    }

    if (isNaN(tagID)) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Please enter the tag ID, the input entered is not a number`,
      );
    }

    const aviURL =
      interaction.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;

    const name = interaction.user.username;

    try {
      const tag = await prisma.tag.findFirst({
        where: {
          id: Number(tagID),
          userId: interaction.user.id,
        },
      });

      if (!tag) {
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  That personal tag does not exist or does not belong to you`,
        );
      }

      await prisma.tag.delete({
        where: {
          id: Number(tagID),
        },
      });

      const tagEmbed = new EmbedBuilder()
        .setTitle("Personal Tag Deleted")
        .setColor(colors.main)
        .setDescription(`${emojis.success}  Tag ${tagID} deleted`)
        .setTimestamp()
        .setAuthor({ name, iconURL: aviURL });

      await interaction.editReply({
        content: "",
        embeds: [tagEmbed],
      });

      log.debug("end");
    } catch (e) {
      log.error(e);

      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Could not delete tag...\n${e}`,
      );
    }
  },
};