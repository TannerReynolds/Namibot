const { sendReply } = require("../../../utils/sendReply");
const { colors, emojis, guilds } = require("../../../config.json");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const prisma = require("../../../utils/prismaClient");
const { getModChannels } = require("../../../utils/getModChannels");
const { isStaff } = require("../../../utils/isStaff");

async function unbanButtonApprove(interaction, args) {
  await interaction.deferReply({ ephemeral: true });
  if (!isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers))
    return sendReply(
      interaction,
      "error",
      `${emojis.error}  You dont have the necessary permissions to complete this action`,
    );
  let target = args[1];
  let targetUser = false;
  try {
    targetUser = await interaction.client.users.fetch(target);
  } catch (e) {
    //do nothing
  }
  let name = interaction.user.username;
  let aviURL =
    interaction.user.avatarURL({
      extension: "png",
      forceStatic: false,
      size: 1024,
    }) || interaction.user.defaultAvatarURL;
  let reason = "Ban Appeal Approved";
  const finishedRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`disabledApprove`)
      .setLabel("Approve Appeal")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`disabledDeny`)
      .setLabel("Deny Appeal")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );

  if (interaction.channel.locked || interaction.channel.archived)
    return sendReply(
      interaction,
      "error",
      `${emojis.error}  This channel is locked`,
    );

  interaction.guild.bans
    .remove(target, {
      reason: `${reason} | Mod: ${interaction.user.username} (${interaction.user.id})`,
    })
    .then(async () => {
      let unbanEmbed = new EmbedBuilder()
        .setTitle(`User Unbanned`)
        .setColor(colors.success)
        .setDescription(
          `${emojis.success}  Successfully unbanned <@${target}>. Reason: ${reason}`,
        )
        .setTimestamp()
        .setAuthor({ name: name, iconURL: aviURL });

      await interaction.message.edit({
        content: interaction.message.content,
        embeds: interaction.message.embeds,
        components: [finishedRow],
      });
      await interaction.channel.send({ embeds: [unbanEmbed] });
      await interaction.channel.setArchived(true);
      await sendReply(
        interaction,
        "success",
        `${emojis.success}  Interaction Complete`,
      );
      if (reason.length > 1024) {
        reason = `${reason.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
      }
      let logEmbed = new EmbedBuilder()
        .setColor(colors.main)
        .setTitle("Member Unbanned")
        .addFields(
          { name: "User", value: `<@${target}> (${target})` },
          { name: "Reason", value: reason },
          { name: "Moderator", value: `${name} (${interaction.user.id})` },
        )
        .setAuthor({ name: name, iconURL: aviURL })
        .setTimestamp();

      await getModChannels(interaction.client, interaction.guild.id).main.send({
        embeds: [logEmbed],
        content: `<@${target}>`,
      });
      if (targetUser) {
        try {
          await targetUser.send(
            `You have been unbanned from ${interaction.guild.name}. Reason: ${reason}\nFeel free to rejoin through this link: ${guilds[interaction.guild.id].invite}`,
          );
        } catch (e) {
          // do nothing
        }
      }
    })
    .catch((e) => {
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Error unbanning member: ${e}`,
      );
    });

  await prisma.ban
    .delete({
      where: {
        userID_guildId: {
          userID: target,
          guildId: interaction.guild.id,
        },
      },
    })
    .catch(() => {
      // do nothing
      // Means they were banned not using the bot if this fails
    });
}

module.exports = { unbanButtonApprove };
