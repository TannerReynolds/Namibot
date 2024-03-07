const { sendReply } = require("../../../utils/sendReply");
const { colors, emojis } = require("../../../config.json");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const { getModChannels } = require("../../../utils/getModChannels");
const { isStaff } = require("../../../utils/isStaff");

async function unbanButtonDeny(interaction, args) {
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
  let reason = "Ban Appeal Denied";

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

  let unbanEmbed = new EmbedBuilder()
    .setTitle(`Member Ban Appeal Approved`)
    .setColor(colors.success)
    .setDescription(`${emojis.success}  Successfully approved ban appeal.`)
    .setTimestamp()
    .setAuthor({ name: name, iconURL: aviURL });

  await interaction.message.edit({
    content: interaction.message.content,
    embeds: interaction.message.embeds,
    components: [finishedRow],
  });
  await interaction.channel.send({ embeds: [unbanEmbed] });
  await interaction.channel.setArchived(true);
  sendReply(interaction, "success", `${emojis.success}  Interaction Complete`);

  if (reason.length > 1024) {
    reason = `${reason.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
  }
  let logEmbed = new EmbedBuilder()
    .setColor(colors.main)
    .setTitle("Member Ban Appeal Denied")
    .addFields(
      { name: "User", value: `<@${target}> (${target})` },
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
        `Your ban appeal in ${interaction.guild.name} has been denied.`,
      );
    } catch (e) {
      // do nothing
    }
  }
}

module.exports = { unbanButtonDeny };
