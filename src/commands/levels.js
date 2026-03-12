const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { isStaffCommand } = require("../utils/isStaff");
const { colors, emojis, guilds } = require("../config.json");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");

const a = 839500 / Math.pow(100, 2);

function calculateRequiredXP(level) {
  return Math.ceil(a * Math.pow(level, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("levels")
    .setDescription("Show all configured level rewards for this guild")
    .setDMPermission(false),
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

      const levelConfig = guilds[interaction.guild.id]?.features?.levels;
      const levelRoles = levelConfig?.roles || levelConfig?.levelRoles || {};

      if (!levelRoles || Object.keys(levelRoles).length === 0) {
        return await interaction.editReply({
          content: `${emojis.error}  No level rewards are configured for this guild`,
        });
      }

      const sortedLevels = Object.keys(levelRoles)
        .map((level) => Number(level))
        .filter((level) => !Number.isNaN(level))
        .sort((a, b) => a - b);

      const lines = [];

      for (const level of sortedLevels) {
        const roleId = levelRoles[level];
        const role = interaction.guild.roles.cache.get(roleId);
        const requiredXP = calculateRequiredXP(level);
        const roleText = role ? `@${role.name}` : `Unknown Role (${roleId})`;

        lines.push(
          `Level ${level} — ${requiredXP} XP — ${roleText}`,
        );
      }

      const embed = new EmbedBuilder()
        .setColor(colors.main)
        .setTitle(`Level Rewards for ${interaction.guild.name}`)
        .setDescription(lines.join("\n").substring(0, 4096))
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });

      await sendReply(
        interaction,
        "success",
        `${emojis.success}  Interaction Complete`,
      );

      log.debug("end");
    } catch (e) {
      log.error(`Error in /levels: ${e}`);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: `${emojis.error}  Something went wrong while running this command.`,
        }).catch(() => {});
      }
    }
  },
};