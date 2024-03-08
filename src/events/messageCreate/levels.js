const guildMemberCache = require("../../utils/guildMemberCache");
const log = require("../../utils/log");
const { guilds } = require("../../config.json");
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const fs = require('fs');

// Assuming a quadratic progression, define a coefficient for the quadratic term
// This coefficient determines how quickly levels increase in difficulty
// 839500 is the amount of xp a member should need to reach level 100
// Based on getting 2300xp every single day for an entire year (2300 * 365)
const a = 839500 / Math.pow(100, 2); // Adjust 'a' as needed to fit the desired difficulty curve

// Function to calculate level based on XP using a quadratic curve
function calculateLevel(xp) {
  // Adjust the formula to use a quadratic progression for levels
  // The formula for level based on XP can be derived from the quadratic equation: xp = a * level^2
  // Solving for level gives: level = sqrt(xp / a)
  return Math.floor(Math.sqrt(xp / a));
}

async function addXP(guildId, userId, message) {
  if (!message.guild) return log.debug("end");
  try {
    log.debug("begin");
    guildMemberCache[guildId][userId].xp += 10;
    if (!guildMemberCache[guildId][userId].changed)
      guildMemberCache[guildId][userId].changed = true;

    let newLevel = calculateLevel(guildMemberCache[guildId][userId].xp);

    if (newLevel !== guildMemberCache[guildId][userId].level) {
      guildMemberCache[guildId][userId].level = newLevel;
      guildMemberCache[guildId][userId].changed = true;
      if (newLevel > 0) {
        if(Object.keys(guilds[guildId].features.levels.roles).length > 0) {
          giveRole(guildId, userId, message, newLevel);
        }
        if (!guilds[message.guild.id].features.levels.levelUpMessage) return log.debug("end");

        message.reply(
          guilds[message.guild.id].features.levels.levelUpMessage.replace(
            /\{\{level\}\}/gi,
            guildMemberCache[guildId][userId].level,
          ),
        );

        if(guilds[message.guild.id].features.levels.generateLevelImage) {
          let aviURL =
        message.author.avatarURL({
          extension: "png",
          forceStatic: false,
          size: 1024,
        }) || message.author.defaultAvatarURL;
        let img = await genImg(message.author.username, newLevel, guildMemberCache[guildId][userId].xp, message.guild.name, aviURL);
        let bufferAttach = new AttachmentBuilder(img, { name: 'profile.png' });
        message.channel.send({ files: [bufferAttach] });
      }
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
	const ctx = canvas.getContext('2d');

	const pfpBuffer = await downloadImage(pfp);
	const foundBGFile = `${__dirname}/../../img/profile.png`;

	const bgBuffer = await await readImageFile(foundBGFile);
	registerFont(`${__dirname}/../../img/fonts/Okta.otf`, { family: 'Okta' });
	const background = await loadImage(bgBuffer);
	const profileImage = await loadImage(pfpBuffer);

	ctx.drawImage(background, coords.bg.pos.x, coords.bg.pos.y, coords.bg.size.w, coords.bg.size.h);

	ctx.drawImage(profileImage, coords.pfp.pos.x, coords.pfp.pos.y, coords.pfp.size.w, coords.pfp.size.h);


	const drawText = (text, pos, maxSize, font, align) => {
		ctx.font = `${maxSize.h}px ${font}`;
		ctx.fillStyle = 'white';
		ctx.textAlign = align;
		ctx.textBaseline = 'bottom';

		const textWidth = ctx.measureText(text).width;
		if (textWidth > maxSize.w) {
			const newFontSize = (maxSize.h * maxSize.w) / textWidth;
			ctx.font = `${newFontSize}px ${font}`;
		}

		ctx.fillText(text, pos.x, pos.y);
	};

	drawText(xp, coords.xp.pos, coords.xp.maxSize, 'Okta', 'left');
	drawText(level, coords.level.pos, coords.level.maxSize, 'Okta', 'left');
	drawText(guildName, coords.guildName.pos, coords.guildName.maxSize, 'Okta', 'center');
	drawText(username, coords.username.pos, coords.username.maxSize, 'Okta', 'center');

	return canvas.toBuffer('image/png');


	async function downloadImage(url) {
		try {
			const response = await axios.get(url, { responseType: 'arraybuffer' });
			const buffer = Buffer.from(response.data, 'binary');
			return buffer;
		}
		catch (error) {
			console.error('Error downloading image:', error);
		}
	}
	async function readImageFile(filePath) {
		return new Promise((resolve, reject) => {
			fs.readFile(filePath, (err, buffer) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(buffer);
				}
			});
		});
	}
}

async function giveRole(guildId, userId, message, level) {
  let levels = guilds[guildId].features.levels.roles;
  let levelsArr = [];
  for (const levelNum in levels) {
    levelsArr.push(levels[levelNum]);
  }
  for (const levelNum in levels) {
    if (Number(level) === Number(levelNum)) {
      const delRole = async () => {
        for (let i = 0; i < levelsArr.length; i++) {
          if (message.member.roles.cache.has(levelsArr[i])) {
            await message.member.roles.remove(levelsArr[i]);
          }
        }
      };

      await delRole();
      return message.member.roles.add(levels[levelNum]);
    }
  }
}
module.exports = { addXP };
