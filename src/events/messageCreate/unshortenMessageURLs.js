const { unshortenURL } = require("../../utils/unshortenURL");
const log = require("../../utils/log");
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { regexMatch } = require("../../utils/regex");
const { colors, guilds, cpuThreads } = require("../../config");
const { getModChannels } = require("../../utils/getModChannels");
const prisma = require("../../utils/prismaClient");
const path = require("path");
const Piscina = require("piscina");
const workerPath = path.resolve(
  __dirname,
  "./workerThreads/blockedDomainsWorker.js",
);
const piscina = new Piscina({
  filename: workerPath,
  maxThreads: cpuThreads,
});

async function unshortenMessageURLs(message) {
  log.debug("begin");
  if (!message.guild) {
    return log.debug("end");
  }
  if (message.author.bot) {
    return log.debug("end");
  }

  let urls = await detectURL(message.content);
  if (!urls || urls.length === 0) {
    return log.debug("end");
  }

  let bdEnabled = guilds[message.guild.id].features.blockedDomains.enabled;
  for (let url of urls) {
    unshortenURL(url).then(async (urls) => {
      if (urls.length === 0) {
        return log.debug("end");
      }
      let isBlocked = false;
      if (bdEnabled) {
        let domain = await extractDomain(urls[0]);
        isBlocked = await checkDomainWithWorker(domain[1]);
      }
      let aviURL =
        message.author.avatarURL({
          extension: "png",
          forceStatic: false,
          size: 1024,
        }) || message.author.defaultAvatarURL;
      let name = message.author.username;
      let formattedURLs = urls.map((url) => `\`${url}\``);
      let urlString = formattedURLs.join(" ⇒ ");
      if (!isBlocked) {
        let unshortEmbed = new EmbedBuilder()
          .setColor(colors.warning)
          .setTitle("Shortened URL Detected")
          .setDescription(urlString)
          .setTimestamp()
          .setAuthor({ name: name, iconURL: aviURL });
        message.reply({ embeds: [unshortEmbed] });
      } else {
        let unshortEmbed = new EmbedBuilder()
          .setColor(colors.main)
          .setTitle("Shortened URL Detected With Blocked Domain Inside")
          .setDescription(
            "You have been timed out automatically for sending a shortened URL with a blocked domain underneath, please contact staff using /modmail to have your timeout removed.",
          )
          .setTimestamp()
          .setAuthor({ name: name, iconURL: aviURL });
        await message.reply({ embeds: [unshortEmbed] });
        message.delete().catch((e) => {
          return;
        });
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
          .setDescription(urlString)
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
              reason:
                "Member Timed Out For Sending Blocked Link Within Shortened URL",
              moderator: `System`,
              type: "MUTE",
            },
          })
          .catch((e) => {
            log.error(`couldn't add warning to database: ${e}`);
          });
      }
    });
  }
  log.debug("end");
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

module.exports = { unshortenMessageURLs };
