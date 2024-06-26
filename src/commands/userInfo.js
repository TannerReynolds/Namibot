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
const guildMemberCache = require("../utils/guildMemberCache");

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
        ephemeral: true,
      });

    let target = await defineTarget(interaction, "edit");
    if (target === undefined) {
      return;
    }

    let targetMember;

    try {
      targetMember = await interaction.guild.members.fetch(target);
    } catch (error) {
      if (error.message.toLowerCase().includes("unknown member")) {
        targetMember = false;
      } else {
        targetMember = false;
      }
    }

    let aviURL =
      interaction.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;
    let name = interaction.user.username;

    let logEmbed = new EmbedBuilder();

    logEmbed.setAuthor({ name: name, iconURL: aviURL });

    if (targetMember) {
      let targetUser = await interaction.client.users.fetch(targetMember.id, {
        force: true,
      });
      let userPfp =
        targetUser.avatarURL({
          extension: "png",
          forceStatic: false,
          size: 1024,
        }) || targetMember.user.defaultAvatarURL;
      let userBanner =
        targetUser.bannerURL({
          extension: "png",
          forceStatic: false,
          size: 1024,
        }) || false;
      logEmbed.setTitle(
        `User Information for ${targetMember.user.username} (${targetMember.user.id})`,
      );
      logEmbed.setColor(targetMember.displayHexColor);
      logEmbed.setThumbnail(userPfp);
      logEmbed.addFields({
        name: "Roles",
        value:
          targetMember.roles.cache
            .map((role) => `<@&${role.id}>`)
            .join(", ")
            .substring(0, 1024) || "N/A",
        inline: false,
      });
      logEmbed.addFields({
        name: "Permissions",
        value:
          targetMember.permissions.toArray().join(", ").substring(0, 1024) ||
          "N/A",
        inline: false,
      });
      logEmbed.addFields({
        name: "Profile Accent Color",
        value: targetMember.user.hexAccentColor || "N/A",
        inline: false,
      });
      if (userBanner) logEmbed.setImage(userBanner);

      let memberCache = guildMemberCache[interaction.guild.id][targetMember.id];
      if (memberCache) {
        let level = memberCache.level || 0;
        let xp = memberCache.xp || 0;
        let totalMessages = memberCache.totalMessages || 0;
        let negativeMessages = memberCache.negativeMessages || 0;
        let negativePercentage =
          (memberCache.negativeMessages / memberCache.totalMessages) * 100;
        if (isNaN(negativePercentage)) negativePercentage = "0";
        logEmbed.addFields({
          name: "Level",
          value: level.toString(),
          inline: true,
        });
        logEmbed.addFields({ name: "XP", value: xp.toString(), inline: true });
        logEmbed.addFields({
          name: "Total Messages",
          value: totalMessages.toString(),
          inline: true,
        });
        logEmbed.addFields({
          name: "Total Negative Messages",
          value: negativeMessages.toString(),
          inline: true,
        });
        logEmbed.addFields({
          name: "Toxicity Rating",
          value: `${negativePercentage.toString().substring(0, 3)}%`,
          inline: true,
        });
      }

      let warnings;
      try {
        warnings = await prisma.warning.findMany({
          where: {
            userID: target,
            guildId: interaction.guild.id,
          },
        });
        if (warnings.length === 0) {
          warnings = false;
        }
      } catch (e) {
        log.error(`Error checking database for warnings: ${e}`);
        warnings = false;
      }
      if (warnings) {
        logEmbed.addFields({
          name: "Warnings",
          value: warnings.length.toString(),
          inline: true,
        });
      } else {
        logEmbed.addFields({ name: "Warnings", value: `None`, inline: true });
      }
    } else {
      logEmbed.setColor(colors.main);
      logEmbed.setDescription(`This user is not a member of this guild`);
    }

    logEmbed.setTimestamp();

    interaction.channel.send({ embeds: [logEmbed] });
    sendReply(
      interaction,
      "success",
      `${emojis.success}  Interaction Complete`,
    );
    log.debug("end");
  },
};
