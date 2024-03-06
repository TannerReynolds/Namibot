const {
  ActionRowBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { isStaff } = require("../../../utils/isStaff");

async function muteButton(interaction, args) {
  if (
    !isStaff(
      interaction,
      interaction.member,
      PermissionFlagsBits.ManageMessages,
    )
  )
    return;
  let target = args[1];

  const modal = new ModalBuilder()
    .setCustomId(`mute_${target}`)
    .setTitle("Mute Member");
  const durationInput = new TextInputBuilder()
    .setCustomId("duration")
    .setLabel("Duration Of Mute")
    .setStyle(TextInputStyle.Short);
  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Reason For Mute")
    .setStyle(TextInputStyle.Paragraph);

  const firstActionRow = new ActionRowBuilder().addComponents(durationInput);
  const secondActionRow = new ActionRowBuilder().addComponents(reasonInput);
  modal.addComponents(firstActionRow, secondActionRow);

  await interaction.showModal(modal);
}

module.exports = { muteButton };
