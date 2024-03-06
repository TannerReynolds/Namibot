const { isStaff } = require("../../utils/isStaff");
const {
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const prisma = require("../../utils/prismaClient");
const { guilds, colors, cpuThreads } = require("../../config");
const { getModChannels } = require("../../utils/getModChannels");
const log = require("../../utils/log");
const path = require("path");
const Piscina = require("piscina");

const workerPath = path.resolve(__dirname, "./workerThreads/antiAdsWorker.js");
const piscina = new Piscina({
  filename: workerPath,
  maxThreads: cpuThreads,
});

/**
 * Checks if a message contains advertisements and takes appropriate actions.
 * @param {Message} message - The message object.
 */
async function antiAds(message) {
  log.debug("begin");
  if (!message.guild) return log.debug("end");
  if (message.author.bot) return log.debug("end");

  try {
    if (!message.content.toLowerCase().includes("discord")) {
      return log.debug("end");
    }

    let sentAd = await checkAds(guilds, message.content, message.guild.id);

    if (!sentAd || typeof sentAd !== "string") return log.debug("end");

    if (isStaff(message, message.member, PermissionFlagsBits.ManageMessages)) {
      return log.debug("end");
    }

    message.delete().catch((e) => {
      log.error(`couldn't delete message: ${e}`);
    });

    message.author
      .send(
        "You have been warned for sending a Discord invite link. Please do not send them before clearing it with staff. If you wish to partner with us, please DM the owners of the server",
      )
      .catch(() => {});

    message.member.timeout(60_000 * 10_080, "Invite Link Sent").catch((e) => {
      log.error(`Couldn't time out member: ${e}`);
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ban_${message.author.id}`)
        .setLabel("Ban User")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`kick_${message.author.id}`)
        .setLabel("Kick User")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`mute_${message.author.id}`)
        .setLabel("Mute User")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`warn_${message.author.id}`)
        .setLabel("Warn User")
        .setStyle(ButtonStyle.Danger),
    );

    let logEmbed = new EmbedBuilder()
      .setColor(colors.main)
      .setTitle("Member Warned")
      .addFields(
        {
          name: "User",
          value: `<@${message.author.id}> (${message.author.id})`,
        },
        { name: "Reason", value: "Discord invite link sent" },
        { name: "Invite Link", value: sentAd },
        { name: "Moderator", value: `System` },
      )
      .setTimestamp();

    getModChannels(message.client, message.guild.id)
      .main.send({
        embeds: [logEmbed],
        content: `<@${message.author.id}> :: https://${sentAd}`,
        components: [row],
      })
      .catch((e) => {
        log.error(`Couldn't log warning: ${e}`);
      });

    prisma.warning
      .create({
        data: {
          userID: message.author.id,
          date: new Date(),
          guildId: message.guild.id,
          reason: "Discord invite link sent",
          moderator: `System`,
          type: "WARN",
        },
      })
      .catch((e) => {
        log.error(`couldn't add warning to database: ${e}`);
      });
    log.debug("end");
  } catch (e) {
    log.error(`Error in antiAds: ${e}`);
  }
  async function checkAds(guilds, content, guildID) {
    try {
      const result = await piscina.run({ guilds, content, guildID });
      return result;
    } catch (error) {
      log.error(`Error in checking ads with a worker thread: ${error}`);
      throw error;
    }
  }
}

module.exports = { antiAds };
