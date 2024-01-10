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
const {
  parseNewDate,
  durationToString,
  isValidDuration,
  durationToSec,
} = require("../utils/parseDuration.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("turtlemode")
    .setDescription("Give somebody their own individual slowmode")
    .addStringOption((option) =>
      option.setName("user").setDescription("The user to slow down")
    )
    .addStringOption((option) =>
      option
        .setName("interval")
        .setDescription(
          "How often this user is allowed to send a message (Minimum 30s)"
        )
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription(
          "How long should this slowmode last (leave blank for permanent)"
        )
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Why are you turning them into a turtle")
    ),
  async execute(interaction) {
    if (
      !isStaff(
        interaction,
        interaction.member,
        PermissionFlagsBits.ManageMessages
      )
    )
      return interaction.reply({
        content: "You're not staff, idiot",
        ephemeral: true,
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

    let duration;
    let durationString = "eternity";
    let turtleDate = new Date();
    if (!interaction.options.getString("duration")) {
      duration = "infinite";
    } else {
      let rawDuration = interaction.options.getString("duration");
      if (await isValidDuration(rawDuration)) {
        duration = await parseNewDate(rawDuration);
        durationString = await durationToString(rawDuration);
      } else {
        duration = "infinite";
      }
    }

    let interval;
    let intervalString = "30 seconds";
    if (!interaction.options.getString("interval")) {
      interval = 30;
    } else {
      let rawInterval = interaction.options.getString("interval");
      if (await isValidDuration(rawInterval)) {
        interval = await durationToSec(rawInterval);
        intervalString = await durationToString(rawInterval);
        if (interval < 30) interval = 30;
      } else {
        interval = 30;
      }
    }

    let reason = interaction.options.getString("reason")
      ? interaction.options.getString("reason")
      : "no reason provided";

    let aviURL = interaction.user
      .avatarURL({ format: "png", dynamic: false })
      .replace("webp", "png");
    let name = interaction.user.username;

    let turtleEmbed = new EmbedBuilder()
      .setTitle(`Turned user into a slow little turt`)
      .setColor(colors.success)
      .setDescription(
        `Successfully initiated slowmode on <@${target}> at an interval of ${intervalString}, for ${durationString}! Reason: ${reason}`
      )
      .setTimestamp()
      .setAuthor({ name: name, iconURL: aviURL });

    interaction.reply({ embeds: [turtleEmbed] });

    if (duration !== "infinite") {
      await prisma.turtleMode.upsert({
        where: {
          userID_guildId: {
            userID: target,
            guildId: interaction.guild.id,
          },
        },
        update: {
          moderator: `${interaction.user.username} (${interaction.user.id})`,
          endDate: duration,
          reason: reason,
          startDate: turtleDate,
          interval: interval,
          duration: durationString,
        },
        create: {
          startDate: turtleDate,
          userID: target,
          guildId: interaction.guild.id,
          moderator: `${interaction.user.username} (${interaction.user.id})`,
          endDate: duration,
          reason: reason,
          interval: interval,
          duration: durationString,
        },
      });
    }
    await prisma.warning.create({
      data: {
        userID: target,
        date: turtleDate,
        guildId: interaction.guild.id,
        reason: reason,
        moderator: `${interaction.user.username} (${interaction.user.id})`,
        type: "SLOWMODE",
      },
    });
  },
};
