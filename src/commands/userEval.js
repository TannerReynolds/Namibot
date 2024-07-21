/* eslint-disable no-unused-vars */
const {
  EmbedBuilder,
} = require("discord.js");
const {
  SlashCommandBuilder,
  AppIntegrationType,
} = require("../utils/ExtSlashCmdBuilder");
const { botOwnerID, colors, emojis } = require("../config.json");
const log = require("../utils/log");
const prisma = require("../utils/prismaClient");
const { sendReply } = require("../utils/sendReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ueval")
    .setDMPermission(false)
    .setDescription("Execute code")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("Code to execute")
        .setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply();
    sendReply(interaction, "main", `${emojis.loading}  Loading Interaction...`);
    if (interaction.user.id !== botOwnerID) {
      return interaction.editReply("Only the bot owner can run this command");
    }

    let aviURL =
      interaction.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;
    let name = interaction.user.username;

    const code = interaction.options.getString("code");
    try {
      let evaled = await eval(code);

      if (typeof evaled !== "string") {
        evaled = require("util").inspect(evaled);
      }

      let responseEmbed = new EmbedBuilder()
        .setTimestamp()
        .setColor(colors.main)
        .setAuthor({ name: name, iconURL: aviURL })
        .addFields(
          { name: "Executed Code", value: `\`\`\`js\n${code}\n\`\`\`` },
          {
            name: "Result",
            value: `\`\`\`xl\n${evaled.length > 1000 ? `${evaled.substring(0, 1000)}...` : evaled.substring(0, 1000)}\n\`\`\``,
          },
        );

      interaction.editReply({ embeds: [responseEmbed] });
    } catch (err) {
      let responseEmbed = new EmbedBuilder()
        .setTimestamp()
        .setColor(colors.error)
        .setAuthor({ name: name, iconURL: aviURL })
        .addFields(
          { name: "Executed Code", value: `\`\`\`js\n${code}\n\`\`\`` },
          {
            name: "Result",
            value: `\`ERROR\` \`\`\`xl\n${err.toString().length > 1000 ? `${err.toString().substring(0, 1000)}...` : err.toString().substring(0, 1000)}\n\`\`\``,
          },
        );
      interaction.editReply({ embeds: [responseEmbed] });
      sendReply(
        interaction,
        "success",
        `${emojis.success}  Interaction Complete`,
      );
    }
  },
};
