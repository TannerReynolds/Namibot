const prisma = require("../../utils/prismaClient");
const guildMemberCache = require("../../utils/guildMemberCache");
const log = require("../../utils/log");
const { guilds } = require("../../config.json");
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, registerFont } = require("canvas");
const axios = require("axios");
const fs = require("fs");

const a = 839500 / Math.pow(100, 2);

function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / a));
}

async function addXP(guildId, userId, message) {
  if (!message.guild) return log.debug("end");

  try {
    log.debug("begin");

    const levelConfig = guilds[guildId]?.features?.levels;
    if (!levelConfig?.enabled) return log.debug("end");

    const existingMember = await prisma.member.findUnique({
      where: {
        userID_guildId: {
          userID: userId,
          guildId,
        },
      },
    });

    const previousXp = existingMember?.xp || 0;
    const previousLevel = calculateLevel(previousXp);
    const newXp = previousXp + 10;
    const newLevel = calculateLevel(newXp);

    const member = await prisma.member.upsert({
      where: {
        userID_guildId: {
          userID: userId,
          guildId,
        },
      },
      create: {
        userID: userId,
        guildId,
        xp: newXp,
        level: newLevel,
      },
      update: {
        xp: newXp,
        level: newLevel,
      },
    });

    if (!guildMemberCache[guildId]) guildMemberCache[guildId] = {};
    if (!guildMemberCache[guildId][userId]) {
      guildMemberCache[guildId][userId] = {
        userID: userId,
        guildId,
        xp: member.xp,
        level: member.level,
        negativeMessages: member.negativeMessages || 0,
        totalMessages: member.totalMessages || 0,
        customRole: member.customRole || null,
      };
    } else {
      guildMemberCache[guildId][userId].xp = member.xp;
      guildMemberCache[guildId][userId].level = member.level;
      guildMemberCache[guildId][userId].negativeMessages =
        member.negativeMessages || 0;
      guildMemberCache[guildId][userId].totalMessages =
        member.totalMessages || 0;
      guildMemberCache[guildId][userId].customRole = member.customRole || null;
      guildMemberCache[guildId][userId].changed = false;
    }

    if (newLevel > previousLevel) {
      const levelRoles = levelConfig.roles || levelConfig.levelRoles || {};

      if (Object.keys(levelRoles).length > 0) {
        await giveRole(guildId, message, newLevel, levelRoles);
      }

      if (levelConfig.levelUpMessage) {
        await message.reply(
          levelConfig.levelUpMessage.replace(/\{\{level\}\}/gi, String(newLevel)),
        );
      }

      if (levelConfig.generateLevelImage) {
        const aviURL =
          message.author.avatarURL({
            extension: "png",
            forceStatic: false,
            size: 1024,
          }) || message.author.defaultAvatarURL;

        const img = await genImg(
          message.author.username,
          newLevel,
          newXp,
          message.guild.name,
          aviURL,
        );

        const bufferAttach = new AttachmentBuilder(img, { name: "profile.png" });
        await message.channel.send({ files: [bufferAttach] });
      }
    }

    log.debug("end");
  } catch (e) {
    log.error(`Error in addXP: ${e}`);
  }
}

async function genImg(username, level, xp, guildName, pfp) {
  const coords = {
    pfp: {
      pos: {
        x: 106,
        y: 19,
      },
      size: {
        w: 185,
        h: 185,
      },
    },
    xp: {
      pos: {
        x: 344,
        y: 130,
      },
      maxSize: {
        w: 116,
        h: 20,
      },
    },
    level: {
      pos: {
        x: 373,
        y: 99,
      },
      maxSize: {
        w: 88,
        h: 20,
      },
    },
    guildName: {
      pos: {
        x: 438,
        y: 168,
      },
      maxSize: {
        w: 262,
        h: 20,
      },
    },
    username: {
      pos: {
        x: 440,
        y: 223,
      },
      maxSize: {
        w: 262,
        h: 20,
      },
    },
    bg: {
      pos: {
        x: 0,
        y: 0,
      },
      size: {
        w: 610,
        h: 256,
      },
    },
  };

  const canvas = createCanvas(610, 256);
  const ctx = canvas.getContext("2d");

  const pfpBuffer = await downloadImage(pfp);
  const foundBGFile = `${__dirname}/../../img/profile.png`;

  const bgBuffer = await readImageFile(foundBGFile);
  registerFont(`${__dirname}/../../img/fonts/Okta.otf`, { family: "Okta" });
  const background = await loadImage(bgBuffer);
  const profileImage = await loadImage(pfpBuffer);

  ctx.drawImage(
    background,
    coords.bg.pos.x,
    coords.bg.pos.y,
    coords.bg.size.w,
    coords.bg.size.h,
  );

  ctx.drawImage(
    profileImage,
    coords.pfp.pos.x,
    coords.pfp.pos.y,
    coords.pfp.size.w,
    coords.pfp.size.h,
  );

  const drawText = (text, pos, maxSize, font, align) => {
    ctx.font = `${maxSize.h}px ${font}`;
    ctx.fillStyle = "white";
    ctx.textAlign = align;
    ctx.textBaseline = "bottom";

    const textWidth = ctx.measureText(String(text)).width;
    if (textWidth > maxSize.w) {
      const newFontSize = (maxSize.h * maxSize.w) / textWidth;
      ctx.font = `${newFontSize}px ${font}`;
    }

    ctx.fillText(String(text), pos.x, pos.y);
  };

  drawText(xp, coords.xp.pos, coords.xp.maxSize, "Okta", "left");
  drawText(level, coords.level.pos, coords.level.maxSize, "Okta", "left");
  drawText(guildName, coords.guildName.pos, coords.guildName.maxSize, "Okta", "center");
  drawText(username, coords.username.pos, coords.username.maxSize, "Okta", "center");

  return canvas.toBuffer("image/png");

  async function downloadImage(url) {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
  }

  async function readImageFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });
  }
}

async function giveRole(guildId, message, level, levels) {
  const levelsArr = [];

  for (const levelNum in levels) {
    levelsArr.push(levels[levelNum]);
  }

  for (const levelNum in levels) {
    if (Number(level) === Number(levelNum)) {
      for (let i = 0; i < levelsArr.length; i++) {
        if (message.member.roles.cache.has(levelsArr[i])) {
        }
      }

      return message.member.roles.add(levels[levelNum]);
    }
  }
}

module.exports = { addXP };