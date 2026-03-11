const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { isStaffCommand } = require("../utils/isStaff");
const prisma = require("../utils/prismaClient");
const { getModChannels } = require("../utils/getModChannels");
const { colors, emojis } = require("../config.json");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("massunban")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Mass unban up to 1000 members at once")
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for unbanning users")
        .setRequired(true),
    ),

  async execute(interaction) {
    log.debug("begin");
    await interaction.deferReply({ ephemeral: true });

    if (!isStaffCommand(this.data.name, interaction, interaction.member, PermissionFlagsBits.Administrator)) {
      return sendReply(interaction, "error", `${emojis.error} You don't have the necessary permissions.`);
    }

    const reason = interaction.options.getString("reason") || "Mass Unbanning";

    await interaction.guild.bans.fetch({ cache: true });
    const bans = interaction.guild.bans.cache;

    let unbannedCount = 0;

    for (const ban of bans.values()) {
      const banReason = ban.reason?.toLowerCase() || "";

      if (["scam", "child", "unban", "racial", "racist", "never", "porn", "gore", "slur", "duration:", "dox"].some((word) => banReason.includes(word))) continue;
      //if (!ban.user.tag.toLowerCase().includes("deleted_user")) continue;

      try {
        await interaction.guild.bans.remove(ban.user.id, `${reason} | Mod: ${interaction.user.tag}`);

        unbannedCount++;

        const unbanEmbed = new EmbedBuilder()
          .setTitle(`User Unbanned`)
          .setColor(colors.success)
          .setDescription(`${emojis.success} Successfully unbanned ${ban.user.tag}. Reason: ${reason}`)
          .setTimestamp()
          .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

        interaction.channel.send({ embeds: [unbanEmbed] });

        await prisma.ban.delete({
          where: {
            userID_guildId: {
              userID: ban.user.id,
              guildId: interaction.guild.id,
            },
          },
        }).catch(() => {});

        const logEmbed = new EmbedBuilder()
          .setColor(colors.main)
          .setTitle("Member Unbanned")
          .addFields(
            { name: "User", value: `${ban.user.tag} (${ban.user.id})` },
            { name: "Reason", value: reason },
            { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          )
          .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        getModChannels(interaction.client, interaction.guild.id).main.send({
          embeds: [logEmbed],
          content: `${ban.user.tag}`,
        });

        await delay(1000);
      } catch (error) {
        log.error(`Failed to unban ${ban.user.tag}: ${error}`);
      }
    }

    sendReply(interaction, "success", `${emojis.success} Mass unban complete. Total unbanned: ${unbannedCount}`);

    log.debug("end");
  },
};