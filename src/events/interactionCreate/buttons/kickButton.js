const {
  ActionRowBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { isStaff } = require("../../../utils/isStaff");

async function kickButton(interaction, args) {
  if (
    !isStaff(interaction, interaction.member, PermissionFlagsBits.KickMembers)
  )
    return;
  let target = args[1];

  const modal = new ModalBuilder()
    .setCustomId(`kick_${target}`)
    .setTitle("Kick Member");
  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Reason For Kick")
    .setStyle(TextInputStyle.Paragraph);

  const actionRow = new ActionRowBuilder().addComponents(reasonInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

module.exports = { kickButton };
