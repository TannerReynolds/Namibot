const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  AttachmentBuilder,
} = require("discord.js");
const { isStaffCommand, hasHigherPerms } = require("../utils/isStaff");
const prisma = require("../utils/prismaClient");
const { defineTarget } = require("../utils/defineTarget");
const {
  defineDuration,
  defineDurationString,
} = require("../utils/defineDuration");
const { getModChannels } = require("../utils/getModChannels");
const { colors, emojis } = require("../config.json");
const c = require("../config.json");
const log = require("../utils/log");
const { sendReply } = require("../utils/sendReply");
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("taketodetroit")
    .setDescription(
      "Send a user to detroit for a certain amount of time",
    )
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The user to send.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for sending this user")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription(
          'The amount of time to send this user for ("forever" for permanent)',
        )
        .setRequired(true),
    ),
  async execute(interaction) {
    log.debug("begin");
    await interaction.deferReply({ ephemeral: true });
    sendReply(interaction, "main", `${emojis.loading}  Loading Interaction...`);

    if (
      !isStaffCommand(
        this.data.name,
        interaction,
        interaction.member,
        PermissionFlagsBits.BanMembers,
      )
    )
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  You dont have the necessary permissions to complete this action`,
      );

    let target = await defineTarget(interaction, "edit");
    if (target === undefined) {
      return;
    }

    let targetMember;

    try {
      targetMember = await interaction.guild.members.fetch(target);
    } catch (error) {
      if (error.message.toLowerCase().includes("unknown member")) {
        targetMember = false;
      } else {
        targetMember = false;
      }
    }

    if (targetMember) {
      let canDoAction = await hasHigherPerms(interaction.member, targetMember);
      if (!canDoAction) {
        return sendReply(
          interaction,
          "error",
          `${emojis.error}  You or the bot does not have permissions to complete this action`,
        );
      }
    }

    let duration = await defineDuration(interaction);
    let durationString = await defineDurationString(interaction);
    let banDate = new Date();

    let reason = interaction.options.getString("reason")
      ? interaction.options.getString("reason")
      : "no reason provided";

    if (targetMember) {
      await targetMember
        .send(
          `You have been banned from ${interaction.guild.name} for \`${reason}\`. The length of your ban is ${durationString}. If you want to appeal this ban, run the /appeal command and fill out the information! To run the /appeal command here in our DMs, you need to join the bot's server:\n${c.appealServer}`,
        )
        .catch(() => {
          // do nothing
        });
    }

    let aviURL =
      interaction.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;
    let name = interaction.user.username;

    const date = new Date(); // current date/time
    const unixTimestamp = Math.floor(date.getTime() / 1000);

    try {
      
      interaction.guild.bans
        .create(target, {
          deleteMessageSeconds: 604800,
          reason: `${reason} | Duration: ${durationString} | Mod: ${interaction.user.username} (${interaction.user.id}) <d:${unixTimestamp}>`,
        })
        .catch((e) => {
          log.error(`Error on banning user: ${target} | ${e}`);
          return sendReply(
            interaction,
            "error",
            `${emojis.error}  Error banning member: ${e}`,
          );
        });
        

      // VIDEO CREATION ////////////////////////////////////
      let victimPfpName = `pfp${target}.png`;
      let victimPfp = targetMember.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;
      const imgDir = path.resolve(__dirname, '../img');
      const victimPfpPath = path.join(imgDir, victimPfpName);
      let victimPfpBuffer = await downloadImage(victimPfp);
      await saveBuffer(victimPfpBuffer, victimPfpPath);

      let modPfpName = `pfp${interaction.user.id}.png`;
      let modPfp = interaction.user.avatarURL({
        extension: "png",
        forceStatic: false,
        size: 1024,
      }) || interaction.user.defaultAvatarURL;
      const modPfpPath = path.join(imgDir, modPfpName);
      let modPfpBuffer = await downloadImage(modPfp);
      await saveBuffer(modPfpBuffer, modPfpPath);


      let outputFile = `${target}detroit.mp4`
      let ffmpegCommand = `ffmpeg -i detroit.mp4 -loop 1 -i img/${modPfpName} -loop 1 -i img/${victimPfpName} -filter_complex "[1:v]scale=147:147[img1];[2:v]scale=188:188[img2_scaled];[img2_scaled]split=4[img2_1][img2_2][img2_3][img2_4];[0:v][img1]overlay=x=189:y=121:enable='between(t,0,3.79)'[step1];[step1][img2_1]overlay=x=161:y=108:enable='between(t,3.79,5.26)'[step2];[step2][img2_2]overlay=x=175:y=74:enable='between(t,5.26,5.50)'[step3];[step3][img2_3]overlay=x=239:y=67:enable='between(t,5.50,6.21)'[step4];[step4][img2_4]overlay=x=279:y=44:enable='between(t,6.21,6.68)'[final]" -map "[final]" -map 0:a? -c:v libx264 -c:a copy -shortest -pix_fmt yuv420p ${outputFile}`


      function runFFmpegAndSend() {
        exec(ffmpegCommand, async (err, stdout, stderr) => {
          if (err) {
            console.error('❌ FFmpeg error:', err.message);
            console.error(stderr);
            return sendReply(interaction, "error", `${emojis.error} FFmpeg error: ${err.message}`);
          }
        
          await sleep(250); // <-- short wait before accessing output
        
          if (!fs.existsSync(outputFile)) {
            return sendReply(interaction, "error", `${emojis.error} Output file not found.`);
          }
        
          const attachment = new AttachmentBuilder(outputFile, { name: 'detroit.mp4' });


      // END VIDEO CREATION ///////////////////////////////

      let banEmbed = new EmbedBuilder()
        .setTitle(`User Sent To Detroit`)
        .setColor(colors.main)
        .setDescription(
          `${emojis.success}  Successfully sent <@${target}> to detroit for ${durationString}. Reason: ${reason}`,
        )
        .setTimestamp()
        .setAuthor({ name: name, iconURL: aviURL });

      await interaction.channel.send({ embeds: [banEmbed], files: [attachment] });
      sendReply(
        interaction,
        "success",
        `${emojis.success}  Interaction Complete`,
      );

      fs.unlinkSync(outputFile);
      fs.unlinkSync(victimPfpPath);
      fs.unlinkSync(modPfpPath);
        });
      }

      runFFmpegAndSend();

      if (reason.length > 1024) {
        reason = `${reason.substring(0, 950)}...\`[REMAINDER OF MESSAGE TOO LONG TO DISPLAY]\``;
      }
      let logEmbed = new EmbedBuilder()
        .setColor(colors.main)
        .setTitle("Member Banned")
        .addFields(
          { name: "User", value: `<@${target}> (${target})` },
          { name: "Reason", value: reason },
          { name: "Ban Duration", value: durationString },
          { name: "Moderator", value: `${name} (${interaction.user.id})` },
        )
        .setAuthor({ name: name, iconURL: aviURL })
        .setTimestamp();

      if (targetMember) {
        logEmbed.setThumbnail(
          targetMember.avatarURL({
            extension: "png",
            forceStatic: false,
            size: 1024,
          })
            ? targetMember.avatarURL({
                extension: "png",
                forceStatic: false,
                size: 1024,
              })
            : targetMember.defaultAvatarURL,
        );
      }

      getModChannels(interaction.client, interaction.guild.id)
        .main.send({
          embeds: [logEmbed],
          content: `<@${target}>`,
        })
        .catch((e) => {
          log.error(`Could not send log message: ${e}`);
        });

      await prisma.ban
        .upsert({
          where: {
            userID_guildId: {
              userID: target,
              guildId: interaction.guild.id,
            },
          },
          update: {
            moderator: `${interaction.user.username} (${interaction.user.id})`,
            endDate: duration,
            reason: reason,
            startDate: banDate,
            duration: durationString,
          },
          create: {
            startDate: banDate,
            userID: target,
            guildId: interaction.guild.id,
            moderator: `${interaction.user.username} (${interaction.user.id})`,
            endDate: duration,
            reason: reason,
            duration: durationString,
          },
        })
        .catch((e) => {
          log.error(`Error upserting ban record ${e}`);
        });
      await prisma.warning
        .create({
          data: {
            userID: target,
            date: banDate,
            guildId: interaction.guild.id,
            reason: reason,
            moderator: `${interaction.user.username} (${interaction.user.id})`,
            type: "BAN",
          },
        })
        .catch((e) => {
          log.error(`Error creating warning log: ${e}`);
        });
    } catch (e) {
      log.error(`Error banning user: ${e}`);
      return sendReply(
        interaction,
        "error",
        `${emojis.error}  Error banning user: ${e}`,
      );
    }
    log.debug("end");
  },
};


async function downloadImage(url) {
  try {
      const response = await axios.get(url, {
          responseType: 'arraybuffer'
      });
      return Buffer.from(response.data, 'binary');
  } catch (error) {
      console.error('Error downloading image:', error);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveBuffer(buf, filePath) {
  fs.writeFileSync(filePath, buf);
}