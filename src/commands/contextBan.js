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
    .setName("Ban Member")
    .setDMPermission(false)
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    if (
      !isStaff(interaction, interaction.member, PermissionFlagsBits.BanMembers)
    )
      return interaction.reply("You do not have permissions to do this action");

    let targetUser = interaction.targetUser;
    if (targetUser === undefined)
      return interaction.reply("This user could not be found.");

    let target = targetUser.id;

    const modal = new ModalBuilder()
      .setCustomId(`ban_${target}`)
      .setTitle("Ban Member");
    const durationInput = new TextInputBuilder()
      .setCustomId("duration")
      .setLabel("Duration Of Ban")
      .setStyle(TextInputStyle.Short);
    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Reason For Ban")
      .setStyle(TextInputStyle.Paragraph);

    const firstActionRow = new ActionRowBuilder().addComponents(durationInput);
    const secondActionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(firstActionRow, secondActionRow);

    await interaction.showModal(modal);
    log.debug("end");
  },
};
