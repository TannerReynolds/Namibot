const {
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const prisma = require("../utils/prismaClient.js");
const { colors, emojis } = require("../config.json");
const { sendReply } = require("../utils/sendReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("usert")
    .setDMPermission(false)
    .setDescription("Send a personal tag")
    .setIntegrationTypes(AppIntegrationType.UserInstall)
    .addStringOption((option) =>
      option
        .setName("tag-name")
        .setDescription("Name of the tag")
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const tagName = interaction.options.getString("tag-name")?.toLowerCase() || false;

    const tag = await prisma.tag.findFirst({
      where: {
        name: tagName,
        userId: interaction.user.id,
      },
    });

    if (!tag) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  That personal tag does not exist`,
      );
    }

    const aviURL =
      interaction.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;

    const name = interaction.user.username;

    const tagEmbed = new EmbedBuilder()
      .setColor(colors.main)
      .setAuthor({ name: name, iconURL: aviURL });

    let attachmentData = null;

    if (tag.attachmentData !== null) {
      try {
        attachmentData = new AttachmentBuilder(
          Buffer.from(tag.attachmentData),
          { name: tag.attachmentName },
        );
      } catch (e) {
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  There was an error forming the buffer attachment: ${e}`,
        );
      }
    }

    if (tag.content) {
      tagEmbed.setDescription(tag.content);
    }

    if (attachmentData) {
      tagEmbed.setImage(`attachment://${tag.attachmentName}`);
    }

    await sendReply(interaction, "main", "Sending tag...");

    if (attachmentData) {
      return interaction.editReply({
        content: "",
        embeds: [tagEmbed],
        files: [attachmentData],
      });
    }

    return interaction.editReply({
      content: "",
      embeds: [tagEmbed],
    });
  },
};