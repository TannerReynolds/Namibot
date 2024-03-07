const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const prisma = require("../utils/prismaClient.js");
const { colors, emojis } = require("../config.json");
const { sendReply } = require("../utils/sendReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("t")
    .setDMPermission(false)
    .setDescription("Send a server tag")
    .addStringOption((option) =>
      option
        .setName("tag-name")
        .setDescription("Name of the tag")
        .setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    let tagName = interaction.options.getString("tag-name")
      ? interaction.options.getString("tag-name").toLowerCase()
      : false;

    const tag = await prisma.tag.findFirst({
      where: {
        name: tagName,
        guildId: interaction.guild.id,
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
      sendReply(interaction, "main", "Sending tag...");
      interaction.channel.send({ embeds: [tagEmbed], files: [attachmentData] });
    } else {
      sendReply(interaction, "main", "Sending tag...");
      interaction.channel.send({ embeds: [tagEmbed] });
    }
  },
};
