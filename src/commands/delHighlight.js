const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { isStaffCommand } = require("../utils/isStaff.js");
const prisma = require("../utils/prismaClient");
const { colors, emojis, guilds } = require("../config.json");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delhighlight")
    .setDMPermission(false)
    .setDescription("Delete a highlight!")
    .addStringOption((option) =>
      option
        .setName("id")
        .setDescription("The ID of the highlight to delete")
        .setRequired(true),
    ),
  async execute(interaction) {
    log.debug("begin");
    await interaction.deferReply({ ephemeral: true });
    sendReply(interaction, "main", `${emojis.loading}  Loading Interaction...`);
    let commandChannel = guilds[interaction.guild.id].botCommandsChannelID;
    if (
      !isStaffCommand(
        this.data.name,
        interaction,
        interaction.member,
        PermissionFlagsBits.BanMembers,
      ) &&
      interaction.channel.id !== commandChannel
    )
      return interaction.editReply({
        content: `${emojis.error}  You have to go to the <#${commandChannel}> channel to use this command`,
      });

    if (!interaction.options.getString("id")) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  No highlight ID provided!`,
      );
    }
    let highlightID = interaction.options.getString("id");

    if (isNaN(highlightID))
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Please enter the highlight ID, the input entered is not a number`,
      );

    let highlight = await prisma.highlight.findUnique({
      where: {
        id: Number(highlightID),
        guildId: interaction.guild.id,
      },
    });

    if (highlight.userID !== interaction.user.id) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  You can't delete somebody else's highlight!`,
      );
    }

    let aviURL =
      interaction.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;
    let name = interaction.user.username;

    await prisma.highlight
      .delete({
        where: {
          id: Number(highlightID),
        },
      })
      .then(() => {
        let highlightEmbed = new EmbedBuilder()
          .setTitle(`Highlight Deleted`)
          .setColor(colors.main)
          .setDescription(
            `${emojis.success}  Highlight \`${highlightID}\` Deleted`,
          )
          .setTimestamp()
          .setAuthor({ name: name, iconURL: aviURL });

        interaction.channel.send({ embeds: [highlightEmbed] });
        sendReply(
          interaction,
          "success",
          `${emojis.success}  Interaction Complete`,
        );
      })
      .catch((e) => {
        sendReply(
          interaction,
          "error",
          `${emojis.error}  Could not delete highlight...\n${e}`,
        );
      });
    log.debug("end");
  },
};
