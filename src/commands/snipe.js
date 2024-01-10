const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { isStaff } = require("../utils/isStaff.js");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("snipe")
    .setDescription("snipe the last deleted message"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (
      !isStaff(
        interaction,
        interaction.member,
        PermissionFlagsBits.ManageMessages
      )
    )
      return interaction.editReply({
        content: "You're not staff, idiot",
        ephemeral: true,
      });

    getSnipeInfo(interaction.channelId).then((snipeInfo) => {
      console.log(snipeInfo);
      if (snipeInfo) {
        let channeltoPost = interaction.client.channels.cache.get(
          interaction.channelId
        );
        if (channeltoPost) {
          sendWebhook();
          async function sendWebhook() {
            try {
              await channeltoPost
                .createWebhook({
                  name: snipeInfo.memberName,
                  avatar: snipeInfo.memberPfp,
                  reason: "snipe command",
                })
                .then((w) => {
                  w.send(snipeInfo.memberMessage).then((m) => {
                    w.delete();
                    interaction.editReply({
                      content: "Sniped.",
                      ephemeral: true,
                    });
                  });
                });
            } catch (error) {
              console.error("Error in createSendDeleteWebhook:", error);
            }
          }
        } else {
          console.log("Channel not found");
        }
      } else {
        console.log("No snipe info found for this channel.");
      }
    });

    async function getSnipeInfo(channelId) {
      try {
        const channelWithSnipe = await prisma.channel.findUnique({
          where: {
            id: channelId,
          },
          include: {
            snipe: true,
          },
        });

        if (channelWithSnipe && channelWithSnipe.snipe) {
          return channelWithSnipe.snipe;
        } else {
          return null;
        }
      } catch (error) {
        console.error("Error fetching snipe info:", error);
        return null;
      }
    }
  },
};
