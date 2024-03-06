const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const log = require("../utils/log.js");
const { isStaff } = require("../utils/isStaff");

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName("Warn Member")
    .setDMPermission(false)
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    if (
      !isStaff(
        interaction,
        interaction.member,
        PermissionFlagsBits.ManageMessages,
      )
    )
      return interaction.reply("You do not have permissions to do this action");

    let targetUser = interaction.targetUser;
    if (targetUser === undefined)
      return interaction.reply("This user could not be found.");

    let target = targetUser.id;

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
    log.debug("end");
  },
};
