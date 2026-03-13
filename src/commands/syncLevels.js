const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { isStaffCommand } = require("../utils/isStaff");
const { emojis, guilds } = require("../config.json");
const prisma = require("../utils/prismaClient");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");

const a = 839500 / Math.pow(100, 2);

function calculateRequiredXP(level) {
  return Math.ceil(a * Math.pow(level, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("synclevels")
    .setDescription("Sync level roles 1+ into stored XP and levels")
    .setDMPermission(false),
  async execute(interaction) {
    log.debug("begin");

    try {
      await interaction.deferReply({ ephemeral: true });
      await sendReply(
        interaction,
        "main",
        `${emojis.loading}  Syncing level roles...`,
      );

      if (
        !isStaffCommand(
          this.data.name,
          interaction,
          interaction.member,
          PermissionFlagsBits.ManageMessages,
        )
      ) {
        return await sendReply(
          interaction,
          "error",
          `${emojis.error}  You dont have the necessary permissions to complete this action`,
        );
      }

      const levelConfig = guilds[interaction.guild.id]?.features?.levels;
      const levelRoles = levelConfig?.roles || levelConfig?.levelRoles || {};

      if (!Object.keys(levelRoles).length) {
        return await sendReply(
          interaction,
          "error",
          `${emojis.error}  No level roles are configured for this guild`,
        );
      }

      await interaction.guild.members.fetch();

      const qualifyingLevels = Object.keys(levelRoles)
        .map((level) => Number(level))
        .filter((level) => !Number.isNaN(level) && level >= 1)
        .sort((a, b) => b - a);

      if (!qualifyingLevels.length) {
        return await sendReply(
          interaction,
          "error",
          `${emojis.error}  No level roles 1 or higher are configured for this guild`,
        );
      }

      const usersToSync = new Map();

      for (const level of qualifyingLevels) {
        const roleId = levelRoles[level];
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) continue;

        for (const [memberId] of role.members) {
          const existing = usersToSync.get(memberId);

          if (!existing || level > existing.level) {
            usersToSync.set(memberId, {
              level,
              xp: calculateRequiredXP(level),
            });
          }
        }
      }

      if (!usersToSync.size) {
        return await sendReply(
          interaction,
          "success",
          `${emojis.success}  No members with level roles 1 or higher were found`,
        );
      }

      await prisma.guild.upsert({
        where: {
          id: interaction.guild.id,
        },
        create: {
          id: interaction.guild.id,
        },
        update: {},
      });

      const operations = [];

      for (const [memberId, data] of usersToSync) {
        operations.push(
          prisma.member.upsert({
            where: {
              userID_guildId: {
                userID: memberId,
                guildId: interaction.guild.id,
              },
            },
            create: {
              userID: memberId,
              guildId: interaction.guild.id,
              xp: data.xp,
              level: data.level,
            },
            update: {
              xp: data.xp,
              level: data.level,
            },
          }),
        );
      }

      await prisma.$transaction(operations);

      await sendReply(
        interaction,
        "success",
        `${emojis.success}  Synced ${usersToSync.size} members with level roles 1 and higher`,
      );

      log.debug("end");
    } catch (e) {
      log.error(`Error in /synclevels: ${e}`);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: `${emojis.error}  Something went wrong while running this command.`,
        }).catch(() => {});
      }
    }
  },
};