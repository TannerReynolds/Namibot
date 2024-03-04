/* eslint-disable no-useless-escape */
const log = require("../../utils/log");
const { regexMatch } = require("../../utils/regex");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const path = require("path");
const Piscina = require("piscina");
const { cpuThreads, colors } = require("../../config");
const { getModChannels } = require("../../utils/getModChannels");
const prisma = require("../../utils/prismaClient");

const workerPath = path.resolve(
  __dirname,
  "./workerThreads/blockedDomainsWorker.js",
);
const piscina = new Piscina({
  filename: workerPath,
  maxThreads: cpuThreads,
});

async function blockedDomains(message) {
  if (!message.guild || message.author.bot) return;
  let urls = await detectURL(message.content);
  if (!urls || urls.length === 0) return;
  for (let url of urls) {
    let domainMatch = await extractDomain(url);
    if (domainMatch && domainMatch.length > 0) {
      let domain = domainMatch[1];
      const isBlocked = await checkDomainWithWorker(domain);
      if (isBlocked) {
        let unshortEmbed = new EmbedBuilder()
          .setColor(colors.main)
          .setTitle("Blocked Domain Detected")
          .setDescription(
            "You have been timed out for 1 week automatically for sending a link from a blocked Domain. Please contact a staff member using /modmail to resolve this issue or you may be banned.",
          )
          .setTimestamp();
        await message.reply({ embeds: [unshortEmbed] });
        message.delete();
        message.member
          .timeout(60_000 * 10_080, "Blocked Domain Within Shortened URL")
          .catch((e) => {
            log.error(`Couldn't time out member: ${e}`);
          });
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`ban_${message.author.id}`)
            .setLabel("Ban User")
            .setStyle(ButtonStyle.Danger),
        );

        let logEmbed = new EmbedBuilder()
          .setColor(colors.main)
          .setTitle(
            "Member Timed Out For Sending Blocked Link Within Shortened URL",
          )
          .setDescription(domain)
          .addFields(
            {
              name: "User",
              value: `<@${message.author.id}> (${message.author.id})`,
            },
            {
              name: "Reason",
              value:
                "Member Timed Out For Sending Blocked Link Within Shortened URL",
            },
            { name: "Moderator", value: `System` },
          )
          .setTimestamp();
        getModChannels(message.client, message.guild.id).main.send({
          embeds: [logEmbed],
          content: `<@${message.author.id}>`,
          components: [row],
        });
        prisma.warning
          .create({
            data: {
              userID: message.author.id,
              date: new Date(),
              guildId: message.guild.id,
              reason: "Member Timed Out For Sending Link From Blocked Site",
              moderator: `System`,
              type: "MUTE",
            },
          })
          .catch((e) => {
            log.error(`couldn't add warning to database: ${e}`);
          });
        break;
      }
    }
  }
}

async function checkDomainWithWorker(domain) {
  try {
    const result = await piscina.run(domain);
    return result;
  } catch (error) {
    log.error(
      `Error inside of checking domain with worker (blockedDomains)(main thread): ${error}`,
    );
    throw error;
  }
}

async function detectURL(string) {
  const urlReg =
    "https?:\\/\\/(www\\.)?[a-zA-Z0-9\\-.]+[a-zA-Z0-9\\-._~:\\/?#[\\]@!$&'()*+,;=]*";
  const urlFlag = "g";

  try {
    const matches = await regexMatch(string, urlReg, urlFlag);
    return matches;
  } catch (e) {
    return null;
  }
}

async function extractDomain(url) {
  const domainReg = "(?:https?:\\/\\/)?(?:www\\.)?([^\\/\\?#]+)(?:[\\/\\?#]|$)";
  try {
    const matches = await regexMatch(url, domainReg, "i");
    return matches;
  } catch (e) {
    return null;
  }
}

module.exports = { blockedDomains };
