const {
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const prisma = require("../utils/prismaClient.js");
const { colors, emojis, guildId } = require("../config.json");
const { sendReply } = require("../utils/sendReply.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("utag")
    .setDMPermission(false)
    .setDescription("Send a user tag")
    .setIntegrationTypes(
      AppIntegrationType.GuildInstall,
      AppIntegrationType.UserInstall,
    )
    .addStringOption((option) =>
      option
        .setName("tag-name")
        .setDescription("Name of the tag")
        .setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply();

    let tagName = interaction.options.getString("tag-name")
      ? interaction.options.getString("tag-name").toLowerCase()
      : false;

    const tag = await prisma.tag.findFirst({
      where: {
        name: tagName,
        guildId: guildId,
      },
    });

    if (!tag) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  That tag does not exist`,
      );
    }

    let aviURL =
      interaction.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;
    let name = interaction.user.username;
    // .setAuthor({ name: name, iconURL: aviURL });

    let tagEmbed = new EmbedBuilder()
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

    if (tag.content) tagEmbed.setDescription(tag.content);
    if (attachmentData) tagEmbed.setImage(`attachment://${tag.attachmentName}`);

    if (attachmentData) {
      interaction.editReply({ embeds: [tagEmbed], files: [attachmentData] });
    } else {
      sendReply(interaction, "main", "Sending tag...");
      interaction.editReply({ embeds: [tagEmbed] });
    }
  },
};
