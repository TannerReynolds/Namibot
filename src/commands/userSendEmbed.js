const {
  EmbedBuilder,
} = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const { colors, emojis } = require("../config.json");
const { sendReply } = require("../utils/sendReply.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("usendembed")
    .setDMPermission(false)
    .setIntegrationTypes(
      AppIntegrationType.GuildInstall,
      AppIntegrationType.UserInstall,
    )
    .setDescription("Send an embed")
    .addStringOption((option) =>
      option.setName("title").setDescription("Embed Title").setMaxLength(120),
    )
    .addBooleanOption((option) =>
      option
        .setName("include-author")
        .setDescription("Include yourself as the author"),
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription(
          "Hex color code for the color (will use default color if blank)",
        )
        .setMaxLength(8),
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Embed Description")
        .setMaxLength(4_000),
    )
    .addStringOption((option) =>
      option
        .setName("image")
        .setDescription("Link to an image to use for the embed"),
    )
    .addStringOption((option) =>
      option
        .setName("thumbnail")
        .setDescription("Link to an image to use for the thumbnail"),
    )
    .addStringOption((option) =>
      option
        .setName("field1-name")
        .setDescription("Embed Field Name")
        .setMaxLength(120),
    )
    .addStringOption((option) =>
      option
        .setName("field1-content")
        .setDescription("Embed Field Content")
        .setMaxLength(1_023),
    )
    .addStringOption((option) =>
      option
        .setName("field2-name")
        .setDescription("Embed Field Name")
        .setMaxLength(120),
    )
    .addStringOption((option) =>
      option
        .setName("field2-content")
        .setDescription("Embed Field Content")
        .setMaxLength(1_023),
    )
    .addStringOption((option) =>
      option
        .setName("field3-name")
        .setDescription("Embed Field Name")
        .setMaxLength(120),
    )
    .addStringOption((option) =>
      option
        .setName("field3-content")
        .setDescription("Embed Field Content")
        .setMaxLength(1_023),
    )
    .addStringOption((option) =>
      option
        .setName("field4-name")
        .setDescription("Embed Field Name")
        .setMaxLength(120),
    )
    .addStringOption((option) =>
      option
        .setName("field4-content")
        .setDescription("Embed Field Content")
        .setMaxLength(1_023),
    )
    .addStringOption((option) =>
      option
        .setName("field5-name")
        .setDescription("Embed Field Name")
        .setMaxLength(120),
    )
    .addStringOption((option) =>
      option
        .setName("field5-content")
        .setDescription("Embed Field Content")
        .setMaxLength(1_023),
    )
    .addStringOption((option) =>
      option
        .setName("field6-name")
        .setDescription("Embed Field Name")
        .setMaxLength(120),
    )
    .addStringOption((option) =>
      option
        .setName("field6-content")
        .setDescription("Embed Field Content")
        .setMaxLength(1_023),
    )
    .addStringOption((option) =>
      option
        .setName("field7-name")
        .setDescription("Embed Field Name")
        .setMaxLength(120),
    )
    .addStringOption((option) =>
      option
        .setName("field7-content")
        .setDescription("Embed Field Content")
        .setMaxLength(1_023),
    ),
  async execute(interaction) {
    await interaction.deferReply();

    let craftedEmbed = new EmbedBuilder();

    let title = interaction.options.getString("title") || false;
    if (title) craftedEmbed.setTitle(title);

    let color = interaction.options.getString("color") || false;
    if (color) {
      if (!/^#[0-9A-F]{6}$/i.test(color))
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  The inputted color is not a valid hex color code. Correct Example: #ff4d6b`,
        );
      craftedEmbed.setColor(color);
    } else {
      craftedEmbed.setColor(colors.main);
    }

    let author = interaction.options.getBoolean("include-author") || false;
    if (author) {
      let aviURL =
        interaction.user.avatarURL({
          extension: "png",
          forceStatic: false,
          size: 1024,
        }) || interaction.user.defaultAvatarURL;
      let name = interaction.user.username;
      craftedEmbed.setAuthor({ name: name, iconURL: aviURL });
    }

    let desc = interaction.options.getString("description") || false;
    if (desc) craftedEmbed.setDescription(desc);

    let img = interaction.options.getString("image") || false;
    if (img) craftedEmbed.setImage(img);

    let thumb = interaction.options.getString("thumbnail") || false;
    if (thumb) craftedEmbed.setThumbnail(thumb);

    let f1Name = interaction.options.getString("field1-name") || false;
    let f1Content = interaction.options.getString("field1-content") || false;
    if (f1Name && f1Content)
      craftedEmbed.addFields({ name: f1Name, value: f1Content });

    let f2Name = interaction.options.getString("field2-name") || false;
    let f2Content = interaction.options.getString("field2-content") || false;
    if (f2Name && f2Content)
      craftedEmbed.addFields({ name: f2Name, value: f2Content });

    let f3Name = interaction.options.getString("field3-name") || false;
    let f3Content = interaction.options.getString("field3-content") || false;
    if (f3Name && f3Content)
      craftedEmbed.addFields({ name: f3Name, value: f3Content });

    let f4Name = interaction.options.getString("field4-name") || false;
    let f4Content = interaction.options.getString("field4-content") || false;
    if (f4Name && f4Content)
      craftedEmbed.addFields({ name: f4Name, value: f4Content });

    let f5Name = interaction.options.getString("field5-name") || false;
    let f5Content = interaction.options.getString("field5-content") || false;
    if (f5Name && f5Content)
      craftedEmbed.addFields({ name: f5Name, value: f5Content });

    let f6Name = interaction.options.getString("field6-name") || false;
    let f6Content = interaction.options.getString("field6-content") || false;
    if (f6Name && f6Content)
      craftedEmbed.addFields({ name: f6Name, value: f6Content });

    let f7Name = interaction.options.getString("field7-name") || false;
    let f7Content = interaction.options.getString("field7-content") || false;
    if (f7Name && f7Content)
      craftedEmbed.addFields({ name: f7Name, value: f7Content });

    if (
      !title &&
      !img &&
      !author &&
      !desc &&
      !f1Name &&
      !f2Name &&
      !f3Name &&
      !f4Name &&
      !f5Name &&
      !f6Name &&
      !f7Name &&
      !thumb
    ) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Cannot send a blank embed...`,
      );
    }

    interaction.editReply({ embeds: [craftedEmbed] })
  },
};
