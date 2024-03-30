const { EmbedBuilder } = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const { colors, emojis } = require("../config.json");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("av")
    .setDMPermission(false)
    .setDescription("Get a member's Avatar")
    .setIntegrationTypes(
      AppIntegrationType.GuildInstall,
      AppIntegrationType.UserInstall,
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get the AV from")
        .setRequired(true),
    ),
  async execute(interaction) {
    log.debug("begin");
    await interaction.deferReply();
    sendReply(interaction, "main", `${emojis.loading}  Loading Interaction...`);

    let targetUser = interaction.options.getUser("user");

    if (!targetUser) {
      return interaction.editReply("Bot cannot access this user's data");
    }

    let pfpURL = targetUser.avatarURL({
      extension: "png",
      forceStatic: false,
      size: 1024,
    })
      ? targetUser.avatarURL({
          extension: "png",
          forceStatic: false,
          size: 1024,
        })
      : targetUser.defaultAvatarURL;
    let aviURL =
      interaction.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;
    let name = interaction.user.username;
    // .setAuthor({ name: name, iconURL: aviURL });

    let avEmbed = new EmbedBuilder()
      .setColor(colors.main)
      .setImage(pfpURL)
      .setAuthor({ name: name, iconURL: aviURL });

    await interaction.editReply({
      embeds: [avEmbed],
    });
    log.debug("end");
  },
};
