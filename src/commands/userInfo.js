const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { isStaffCommand } = require("../utils/isStaff");
const { defineTarget } = require("../utils/defineTarget");
const { colors, emojis, guilds } = require("../config.json");
const prisma = require("../utils/prismaClient");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription(
      "Get information about a user using either a mention, username, or an id",
    )
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get information for")
        .setRequired(true),
    ),
  async execute(interaction) {
    log.debug("begin");

    try {
      await interaction.deferReply({ ephemeral: true });
      await sendReply(
        interaction,
        "main",
        `${emojis.loading}  Loading Interaction...`,
      );

      const commandChannel = guilds[interaction.guild.id].botCommandsChannelID;

      if (
        !isStaffCommand(
          this.data.name,
          interaction,
          interaction.member,
          PermissionFlagsBits.BanMembers,
        ) &&
        interaction.channel.id !== commandChannel
      ) {
        return await interaction.editReply({
          content: `${emojis.error}  You have to go to the <#${commandChannel}> channel to use this command`,
        });
      }

      const target = await defineTarget(interaction, "edit");
      if (target === undefined) return;

      let targetMember = null;

      try {
        targetMember = await interaction.guild.members.fetch(target);
      } catch (error) {
        targetMember = null;
      }

      const aviURL =
        interaction.user.avatarURL({
          extension: "png",
          forceStatic: false,
          size: 1024,
        }) || interaction.user.defaultAvatarURL;

      const name = interaction.user.username;

      const logEmbed = new EmbedBuilder()
        .setAuthor({ name, iconURL: aviURL })
        .setTimestamp();

      if (targetMember) {
        const targetUser = await interaction.client.users.fetch(targetMember.id, {
          force: true,
        });

        const userPfp =
          targetUser.avatarURL({
            extension: "png",
            forceStatic: false,
            size: 1024,
          }) || targetMember.user.defaultAvatarURL;

        const userBanner =
          targetUser.bannerURL({
            extension: "png",
            forceStatic: false,
            size: 1024,
          }) || null;

        logEmbed.setTitle(
          `User Information for ${targetMember.user.username} (${targetMember.user.id})`,
        );

        logEmbed.setColor(
          targetMember.displayHexColor && targetMember.displayHexColor !== "#000000"
            ? targetMember.displayHexColor
            : colors.main,
        );

        logEmbed.setThumbnail(userPfp);

        const rolesText =
          targetMember.roles.cache
            .map((role) => `<@&${role.id}>`)
            .join(", ")
            .substring(0, 1024) || "N/A";

        logEmbed.addFields({
          name: "Roles",
          value: rolesText,
          inline: false,
        });

        logEmbed.addFields({
          name: "Profile Accent Color",
          value: targetMember.user.hexAccentColor || "N/A",
          inline: false,
        });

        if (userBanner) logEmbed.setImage(userBanner);

        let memberData = null;

        try {
          memberData = await prisma.member.findUnique({
            where: {
              userID_guildId: {
                userID: targetMember.id,
                guildId: interaction.guild.id,
              },
            },
          });
        } catch (e) {
          log.error(`Error checking database for member data: ${e}`);
          memberData = null;
        }

        const level = memberData?.level || 0;
        const xp = memberData?.xp || 0;
        const totalMessages = memberData?.totalMessages || 0;
        const negativeMessages = memberData?.negativeMessages || 0;
        let negativePercentage = 0;

        if (totalMessages > 0) {
          negativePercentage = (negativeMessages / totalMessages) * 100;
        }

        logEmbed.addFields({
          name: "Level",
          value: String(level),
          inline: true,
        });
        logEmbed.addFields({
          name: "XP",
          value: String(xp),
          inline: true,
        });
        logEmbed.addFields({
          name: "Total Messages",
          value: String(totalMessages),
          inline: true,
        });

        let warnings = [];

        try {
          warnings = await prisma.warning.findMany({
            where: {
              userID: target,
              guildId: interaction.guild.id,
            },
          });
        } catch (e) {
          log.error(`Error checking database for warnings: ${e}`);
          warnings = [];
        }

        logEmbed.addFields({
          name: "Warnings",
          value: warnings.length ? String(warnings.length) : "None",
          inline: true,
        });
      } else {
        logEmbed
          .setColor(colors.main)
          .setDescription("This user is not a member of this guild");
      }

      await interaction.channel.send({ embeds: [logEmbed] });

      await sendReply(
        interaction,
        "success",
        `${emojis.success}  Interaction Complete`,
      );

      log.debug("end");
    } catch (e) {
      log.error(`Error in /userinfo: ${e}`);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: `${emojis.error}  Something went wrong while running this command.`,
        }).catch(() => {});
      }
    }
  },
};