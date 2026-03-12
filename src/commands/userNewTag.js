const {
  EmbedBuilder,
} = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const prisma = require("../utils/prismaClient.js");
const { colors, emojis } = require("../config.json");
const log = require("../utils/log.js");
const axios = require("axios");
const { sendReply } = require("../utils/sendReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("usernewtag")
    .setDMPermission(false)
    .setDescription("Create a personal tag")
    .setIntegrationTypes(AppIntegrationType.UserInstall)
    .addStringOption((option) =>
      option
        .setName("tag-name")
        .setDescription("What should the tag be called")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("content")
        .setDescription("The content of the tag")
        .setMaxLength(1900),
    )
    .addAttachmentOption((option) =>
      option
        .setName("attachment")
        .setDescription("Any attachment you want to add to the tag"),
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await sendReply(
      interaction,
      "main",
      `${emojis.loading}  Loading Interaction...`,
    );

    const tagName = interaction.options.getString("tag-name")?.toLowerCase() || false;
    let content = interaction.options.getString("content") || false;
    const attachment = interaction.options.getAttachment("attachment") || false;

    if (!content && !attachment) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  You need to provide either content or an attachment for the tag`,
      );
    }

    if (content) {
      content = content.replace(/\{\{newline\}\}/g, String.fromCharCode(10));
    }

    const existingTag = await prisma.tag.findFirst({
      where: {
        name: tagName,
        userId: interaction.user.id,
      },
    });

    if (existingTag) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  A personal tag with that name already exists`,
      );
    }

    const tagEmbed = new EmbedBuilder()
      .setTitle("New Personal Tag Added")
      .setColor(colors.main)
      .setTimestamp();

    if (content) {
      let displayContent = content;
      if (displayContent.length > 1024) {
        displayContent = `${displayContent.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
      }
      tagEmbed.addFields({ name: "Content", value: displayContent });
    }

    if (attachment) {
      tagEmbed.addFields({ name: "Attachment", value: attachment.name });
    }

    let attachmentData = null;

    if (attachment) {
      if (!attachment.width || attachment.width === null) {
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  This attachment is not recognized as an image`,
        );
      }

      if (attachment.contentType?.toLowerCase().includes("video")) {
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  This attachment is a video, please use an image/gif instead`,
        );
      }

      if (attachment.size > 25000000) {
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  The attachment is too large. The maximum size is 25MB`,
        );
      }

      try {
        attachmentData = await downloadAttachmentData(attachment.url);
      } catch (e) {
        log.error(e);
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  There was an error downloading this attachment: ${e}`,
        );
      }

      if (!attachmentData) {
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  There was an error downloading this attachment`,
        );
      }

      if (attachmentData.length > 25000000) {
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  The attachment is too large. The maximum size is 25MB`,
        );
      }

      if (attachmentData.length === 0) {
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  The attachment is empty`,
        );
      }
    }

    await prisma.user.upsert({
      where: {
        id: interaction.user.id,
      },
      update: {},
      create: {
        id: interaction.user.id,
      },
    });

    await prisma.tag.create({
      data: {
        name: tagName,
        userId: interaction.user.id,
        content: content || null,
        attachmentName: attachment ? attachment.name : null,
        attachmentData: attachment || attachmentData ? attachmentData : null,
      },
    }).then(async () => {
      await interaction.editReply({
        content: `${emojis.success}  Interaction Complete`,
        embeds: [tagEmbed],
      });
    }).catch((e) => {
      log.error(e);
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  There was an error creating the tag: ${e}`,
      );
    });

    async function downloadAttachmentData(url) {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
      });
      return Buffer.from(response.data, "binary");
    }
  },
};