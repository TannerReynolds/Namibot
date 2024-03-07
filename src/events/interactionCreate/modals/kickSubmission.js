const { EmbedBuilder } = require("discord.js");
const { colors, emojis, guilds } = require("../../../config.js");
const log = require("../../../utils/log.js");
const { sendReply } = require("../../../utils/sendReply.js");
const prisma = require("../../../utils/prismaClient.js");
const { hasHigherPerms } = require("../../../utils/isStaff");
const { getModChannels } = require("../../../utils/getModChannels");
const c = require("../../../config.json");

async function kickSubmission(interaction, args) {
  await interaction.deferReply({ ephemeral: true });

  let target = args[1];

  let reason = false;
  try {
    reason = interaction.fields.getTextInputValue("reason");
  } catch (e) {
    return sendReply(interaction, "error", "Reason is required");
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

  if (targetMember) {
    let canDoAction = await hasHigherPerms(interaction.member, targetMember);
    if (!canDoAction) {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  You or the bot does not have permissions to complete this action`,
      );
    }
  }

  if (targetMember) {
    await targetMember
      .send(
        `You have been kicked from ${interaction.guild.name} for \`${reason}\`. You may rejoin at using this link: ${guilds[interaction.guild.id].invite}`,
      )
      .catch(() => {});
  }

  let aviURL =
    interaction.user.avatarURL({
      extension: "png",
      forceStatic: false,
      size: 1024,
    }) || interaction.user.defaultAvatarURL;
  let name = interaction.user.username;

  try {
    targetMember.kick(reason).catch((e) => {
      log.error(`Error on kicking user: ${target} | ${e}`);
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Error kicking member: ${e}`,
      );
    });

    let kickEmbed = new EmbedBuilder()
      .setTitle(`User Kicked`)
      .setColor(colors.main)
      .setDescription(
        `${emojis.success}  Successfully kicked <@${target}>. Reason: ${reason}`,
      )
      .setTimestamp()
      .setAuthor({ name: name, iconURL: aviURL });

    let cur = interaction.channel.id;
    let mainCh = guilds[interaction.guild.id].mainLogChannelID;
    let secCh = guilds[interaction.guild.id].secondaryChannelID;
    if (cur !== mainCh || cur !== secCh) {
      await interaction.channel.send({ embeds: [kickEmbed] });
    }

    sendReply(
      interaction,
      "success",
      `${emojis.success}  Interaction Complete`,
    );

    if (reason.length > 1024) {
      reason = `${reason.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
    }
    let logEmbed = new EmbedBuilder()
      .setColor(colors.main)
      .setTitle("Member Kicked")
      .addFields(
        { name: "User", value: `<@${target}> (${target})` },
        { name: "Reason", value: reason },
        { name: "Moderator", value: `${name} (${interaction.user.id})` },
      )
      .setAuthor({ name: name, iconURL: aviURL })
      .setTimestamp();

    if (targetMember) {
      logEmbed.setThumbnail(
        targetMember.avatarURL({
          extension: "png",
          forceStatic: false,
          size: 1024,
        })
          ? targetMember.avatarURL({
              extension: "png",
              forceStatic: false,
              size: 1024,
            })
          : targetMember.defaultAvatarURL,
      );
    }

    getModChannels(interaction.client, interaction.guild.id)
      .main.send({
        embeds: [logEmbed],
        content: `<@${target}>`,
      })
      .catch((e) => {
        log.error(`Could not send log message: ${e}`);
      });

    await prisma.warning
      .create({
        data: {
          userID: target,
          date: new Date(),
          guildId: interaction.guild.id,
          reason: reason,
          moderator: `${interaction.user.username} (${interaction.user.id})`,
          type: "KICK",
        },
      })
      .catch((e) => {
        log.error(`Error creating warning log: ${e}`);
      });
  } catch (e) {
    log.error(`Error banning user: ${e}`);
    return sendReply(
      interaction,
      "error",
      `${emojis.error}  Error kicking user: ${e}`,
    );
  }
  log.debug("end");
}

module.exports = { kickSubmission };
