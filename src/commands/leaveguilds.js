const { EmbedBuilder } = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const { botOwnerID, colors, emojis, guilds, appealServer } = require("../config");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaveguilds")
    .setDescription("Leave all guilds except configured guilds and the appeal server")
    .setDMPermission(false)
    .setIntegrationTypes(AppIntegrationType.UserInstall),

  async execute(interaction) {
    log.debug("begin");
    await interaction.deferReply({ ephemeral: true });
    await sendReply(
      interaction,
      "main",
      `${emojis.loading}  Loading Interaction...`,
    );

    if (interaction.user.id !== botOwnerID) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  You dont have the necessary permissions to complete this action`,
      );
    }

    try {
      const keepGuildIds = new Set(Object.keys(guilds || {}));

      if (appealServer) {
        try {
          const invite = await interaction.client.fetchInvite(appealServer);
          if (invite.guild?.id) {
            keepGuildIds.add(invite.guild.id);
          }
        } catch (error) {
          log.error(`Failed to resolve appeal server invite: ${error}`);
        }
      }

      const leftGuilds = [];
      const keptGuilds = [];
      const failedGuilds = [];

      for (const guild of interaction.client.guilds.cache.values()) {
        if (keepGuildIds.has(guild.id)) {
          keptGuilds.push(`${guild.name} (${guild.id})`);
          continue;
        }

        try {
          await guild.leave();
          leftGuilds.push(`${guild.name} (${guild.id})`);
        } catch (error) {
          log.error(`Failed to leave guild ${guild.id}: ${error}`);
          failedGuilds.push(`${guild.name} (${guild.id})`);
        }
      }

      const embed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle("Guild Cleanup Complete")
        .addFields(
          {
            name: "Kept",
            value: keptGuilds.length ? keptGuilds.join("\n").slice(0, 1024) : "None",
          },
          {
            name: "Left",
            value: leftGuilds.length ? leftGuilds.join("\n").slice(0, 1024) : "None",
          },
          {
            name: "Failed",
            value: failedGuilds.length ? failedGuilds.join("\n").slice(0, 1024) : "None",
          },
        )
        .setTimestamp();

      await interaction.editReply({
        content: `${emojis.success}  Interaction Complete`,
        embeds: [embed],
      });

      log.debug("end");
    } catch (error) {
      log.error(error);
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Failed to leave guilds`,
      );
    }
  },
};