const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { isStaff } = require("../utils/isStaff.js");
const { extractSnowflake } = require("../utils/validate.js");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const colors = require("../utils/embedColors");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription(
      "Kick a user from the server using either a mention or an id"
    )
    .addStringOption((option) =>
      option.setName("user").setDescription("The user to ban.")
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for kicking this user")
    ),
  async execute(interaction) {
    if (
      !isStaff(interaction, interaction.member, PermissionFlagsBits.KickMembers)
    )
      return interaction.reply({
        content: "You're not staff, idiot",
        ephemeral: true,
      });

    await prisma.guild.upsert({
      where: { id: interaction.guild.id },
      update: {},
      create: { id: interaction.guild.id },
    });

    let target;

    if (!interaction.options.getString("user")) {
      return sendReply("error", "No user entered");
    }

    let userString = interaction.options.getString("user");

    if (!extractSnowflake(userString)) {
      return sendReply("error", "This is not a valid user");
    } else {
      target = extractSnowflake(userString)[0];
    }

    let reason = interaction.options.getString("reason")
      ? interaction.options.getString("reason")
      : "no reason provided";

    let guildMember = await interaction.guild.members.fetch(target);
    guildMember.kick(reason).catch((e) => {
      return sendReply("error", `Error when attemping to kick member: ${e}`);
    });

    let aviURL = interaction.user
      .avatarURL({ format: "png", dynamic: false })
      .replace("webp", "png");
    let name = interaction.user.username;

    let kickEmbed = new EmbedBuilder()
      .setTitle(`User Kicked`)
      .setColor(colors.success)
      .setDescription(`Kicked <@${target}>. Reason: ${reason}`)
      .setTimestamp()
      .setAuthor({ name: name, iconURL: aviURL });

    interaction.reply({ embeds: [kickEmbed] });

    function sendReply(type, message) {
      let replyEmbed = new EmbedBuilder()
        .setColor(colors[type])
        .setDescription(message)
        .setTimestamp();

      interaction.reply({ embeds: [replyEmbed] });
    }

    await prisma.warning.create({
      data: {
        userID: target,
        date: new Date(),
        guildId: interaction.guild.id,
        reason: reason,
        moderator: `${interaction.user.username} (${interaction.user.id})`,
        type: "KICK",
      },
    });
  },
};
