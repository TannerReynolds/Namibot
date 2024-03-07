const { colors } = require("../src/config.json");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

main();

async function main() {
  let img = await generateCaptcha();
  let img2 = await getImgValiCode();

  //fs.writeFileSync(path.join(__dirname, 'captcha.png'), img);
  fs.writeFileSync(path.join(__dirname, "captcha.png"), img2);
}

async function generateCaptcha() {
  const width = 600;
  const height = 300;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = colors.main;
  context.fillRect(0, 0, width, height);

  let textColor = await darkerHex(colors.main, 20);

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 6; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  context.font = "48px Arial";
  context.fillStyle = textColor;
  context.textBaseline = "top";
  const textWidth = context.measureText(text).width;
  const x = (width - textWidth) / 2;
  const y = (height - 60) / 2;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charWidth = context.measureText(char).width;
    context.save();

    context.translate(x + charWidth / 2 + charWidth * i, y + 30);
    context.rotate((Math.random() - 0.5) * 0.5);
    context.translate(-(x + charWidth / 2 + charWidth * i), -(y + 30));

    context.fillText(char, x + charWidth * i, y);
    context.restore();
  }

  for (let i = 0; i < width; i += 4) {
    for (let j = 0; j < height; j += 4) {
      if (Math.random() > 0.5) {
        context.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
        context.fillRect(i, j, 4, 4);
      }
    }
  }

  const buffer = canvas.toBuffer("image/png");
  return buffer;
}

async function darkerHex(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);

  r = r.toString(16).padStart(2, "0");
  g = g.toString(16).padStart(2, "0");
  b = b.toString(16).padStart(2, "0");

  return `#${r}${g}${b}`;
}

let rightCode = "";

// thanks https://codepen.io/guanqi/pen/mdbXQOJ
async function getImgValiCode() {
  let showNum = [];
  let canvasWinth = 150;
  let canvasHeight = 30;
  const canvas = createCanvas(canvasWinth, canvasHeight);
  let context = canvas.getContext("2d");

  canvas.width = canvasWinth;
  canvas.height = canvasHeight;
  context.fillStyle = colors.main;
  context.fillRect(0, 0, canvasWinth, canvasHeight);
  let sCode =
    "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,0,1,2,3,4,5,6,7,8,9,!,@,#,$,%,,&";
  let saCode = sCode.split(",");
  let saCodeLen = saCode.length;
  for (let i = 0; i <= 6; i++) {
    let sIndex = Math.floor(Math.random() * saCodeLen);
    let sDeg = (Math.random() * 30 * Math.PI) / 180;
    let cTxt = saCode[sIndex];
    showNum[i] = cTxt.toLowerCase();
    let x = 10 + i * 20;
    let y = 20 + Math.random() * 8;
    context.font = "bold 23px Consolas";
    context.translate(x, y);
    context.rotate(sDeg);

    context.fillStyle = randomColor();
    context.fillText(cTxt, 0, 0);

    context.rotate(-sDeg);
    context.translate(-x, -y);
  }
  for (let i = 0; i <= 5; i++) {
    context.strokeStyle = randomColor();
    context.beginPath();
    context.moveTo(Math.random() * canvasWinth, Math.random() * canvasHeight);
    context.lineTo(Math.random() * canvasWinth, Math.random() * canvasHeight);
    context.stroke();
  }
  for (let i = 0; i < 30; i++) {
    context.strokeStyle = randomColor();
    context.beginPath();
    let x = Math.random() * canvasWinth;
    let y = Math.random() * canvasHeight;
    context.moveTo(x, y);
    context.lineTo(x + 1, y + 1);
    context.stroke();
  }
  rightCode = showNum.join("");
  console.log(rightCode);
  const buffer = canvas.toBuffer("image/png");
  return buffer;
}

function randomColor() {
  let r = Math.floor(Math.random() * 256);
  let g = Math.floor(Math.random() * 256);
  let b = Math.floor(Math.random() * 256);
  return "rgb(" + r + "," + g + "," + b + ")";
}
