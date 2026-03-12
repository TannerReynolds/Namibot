const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { isStaffCommand } = require("../utils/isStaff");
const { defineTarget } = require("../utils/defineTarget");
const { emojis, guilds, colors } = require("../config.json");
const prisma = require("../utils/prismaClient");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");
const guildMemberCache = require("../utils/guildMemberCache");

const a = 839500 / Math.pow(100, 2);

function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / a));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("xp")
    .setDescription("Add, remove, or set a user's XP")
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The user to modify XP for")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Whether to add, remove, or set XP")
        .setRequired(true)
        .addChoices(
          { name: "add", value: "add" },
          { name: "remove", value: "remove" },
          { name: "set", value: "set" },
        ),
    )
    .addNumberOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount of XP to add, remove, or set")
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

      if (
      !isStaffCommand(
        this.data.name,
        interaction,
        interaction.member,
        PermissionFlagsBits.ManageMessages,
      )
    )
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  You dont have the necessary permissions to complete this action`,
      );

      const target = await defineTarget(interaction, "edit");
      if (target === undefined) return;

      const action = interaction.options.getString("action");
      const rawAmount = interaction.options.getNumber("amount");
      const amount = Math.floor(rawAmount);

      if (!Number.isFinite(amount) || amount < 0) {
        return await interaction.editReply({
          content: `${emojis.error}  The amount must be a positive number or 0`,
        });
      }

      let targetMember = null;

      try {
        targetMember = await interaction.guild.members.fetch(target);
      } catch (e) {
        targetMember = null;
      }

      const existingMember = await prisma.member.findUnique({
        where: {
          userID_guildId: {
            userID: target,
            guildId: interaction.guild.id,
          },
        },
      });

      const currentXp = existingMember?.xp || 0;

      let newXp = currentXp;

      if (action === "add") {
        newXp = currentXp + amount;
      } else if (action === "remove") {
        newXp = Math.max(0, currentXp - amount);
      } else if (action === "set") {
        newXp = Math.max(0, amount);
      }

      const newLevel = calculateLevel(newXp);

      const updatedMember = await prisma.member.upsert({
        where: {
          userID_guildId: {
            userID: target,
            guildId: interaction.guild.id,
          },
        },
        create: {
          userID: target,
          guildId: interaction.guild.id,
          xp: newXp,
          level: newLevel,
        },
        update: {
          xp: newXp,
          level: newLevel,
        },
      });

      if (!guildMemberCache[interaction.guild.id]) {
        guildMemberCache[interaction.guild.id] = {};
      }

      if (!guildMemberCache[interaction.guild.id][target]) {
        guildMemberCache[interaction.guild.id][target] = {
          userID: target,
          guildId: interaction.guild.id,
          xp: updatedMember.xp,
          level: updatedMember.level,
          negativeMessages: updatedMember.negativeMessages || 0,
          totalMessages: updatedMember.totalMessages || 0,
          customRole: updatedMember.customRole || null,
          changed: false,
        };
      } else {
        guildMemberCache[interaction.guild.id][target].xp = updatedMember.xp;
        guildMemberCache[interaction.guild.id][target].level = updatedMember.level;
        guildMemberCache[interaction.guild.id][target].negativeMessages =
          updatedMember.negativeMessages || 0;
        guildMemberCache[interaction.guild.id][target].totalMessages =
          updatedMember.totalMessages || 0;
        guildMemberCache[interaction.guild.id][target].customRole =
          updatedMember.customRole || null;
        guildMemberCache[interaction.guild.id][target].changed = false;
      }

      const displayName = targetMember
        ? `${targetMember.user.username} (${targetMember.id})`
        : target;

        let xpEmbed = new EmbedBuilder()
              .setTitle(`XP Updated`)
              .setColor(colors.main)
              .setDescription(
                `${emojis.success}  XP updated for ${displayName}\nAction: ${action}\nPrevious XP: ${currentXp}\nNew XP: ${updatedMember.xp}\nNew Level: ${updatedMember.level}`,
              )
              .setTimestamp()
        
            interaction.channel.send({ embeds: [xpEmbed] });

        await sendReply(
        interaction,
        "success",
        `${emojis.success}  Interaction Complete`,
      );

      log.debug("end");
    } catch (e) {
      log.error(`Error in /xp: ${e}`);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: `${emojis.error}  Something went wrong while running this command.`,
        }).catch(() => {});
      }
    }
  },
};