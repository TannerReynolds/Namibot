const {
  ActionRowBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { isStaff } = require("../../../utils/isStaff");

async function warnButton(interaction, args) {
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
    .setCustomId(`warn_${target}`)
    .setTitle("Warn Member");
  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Reason For Warn")
    .setStyle(TextInputStyle.Paragraph);

  const actionRow = new ActionRowBuilder().addComponents(reasonInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

module.exports = { warnButton };
