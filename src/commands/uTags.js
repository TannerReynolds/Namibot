const { EmbedBuilder } = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const prisma = require("../utils/prismaClient.js");
const { colors, emojis } = require("../config.json");
const { Pagination } = require("@lanred/discordjs-button-embed-pagination");
const { sendReply } = require("../utils/sendReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("usertags")
    .setDMPermission(false)
    .setDescription("See your personal tags")
    .setIntegrationTypes(AppIntegrationType.UserInstall),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await sendReply(
      interaction,
      "main",
      `${emojis.loading}  Loading Interaction...`,
    );

    const aviURL =
      interaction.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;

    const name = interaction.user.username;

    try {
      const tags = await prisma.tag.findMany({
        where: {
          userId: interaction.user.id,
        },
        orderBy: {
          name: "asc",
        },
      });

      if (!tags || tags.length === 0) {
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  You have no personal tags.`,
        );
      }

      const formattedTags = tags.map((tag) => {
        return [
          `ID: \`${tag.id}\` | Name: \`${tag.name}\``,
          `Content: \`${tag.content ? tag.content : "N/A"}\`\nAttachment: \`${tag.attachmentName ? tag.attachmentName : "N/A"}\``,
        ];
      });

      const tagsPerPage = 10;
      const pages = [];

      for (let i = 0; i < formattedTags.length; i += tagsPerPage) {
        const pageTags = formattedTags.slice(i, i + tagsPerPage);

        const embed = new EmbedBuilder()
          .setTitle("Personal Tags")
          .setDescription("Showing all of your personal tags")
          .setColor(colors.main)
          .setTimestamp()
          .setAuthor({ name, iconURL: aviURL });

        pageTags.forEach((tag) => {
          let value = tag[1];

          if (value.length > 1024) {
            value = `${value.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
          }

          embed.addFields({ name: tag[0], value });
        });

        pages.push(embed);
      }

      if (pages.length > 1) {
        await new Pagination(interaction, pages, "Page", 600000).paginate();
      } else {
        await interaction.editReply({ embeds: [pages[0]] });
      }
    } catch (error) {
      await sendReply(
        interaction,
        "error",
        `${emojis.error}  Error fetching tags: ${error}`,
      );
      throw error;
    }
  },
};