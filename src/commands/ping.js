const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const prisma = require("../utils/prismaClient");
const { colors, emojis } = require("../config");
const log = require("../utils/log");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDMPermission(false)
    .setDescription("Pong"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    let pingEmbed = new EmbedBuilder()
      .setColor(colors.main)
      .setDescription(`${emojis.success}  Pong!`)
      .setTimestamp();

    interaction.editReply({ embeds: [pingEmbed] });
  },
};
