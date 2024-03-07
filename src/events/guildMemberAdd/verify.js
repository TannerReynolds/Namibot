const { createCanvas } = require("canvas");
const { colors, emojis, guilds } = require("../../config.json");
let rightCode = "";

async function verifyMessage(member) {
  if (member.user.bot) return runVerify(member);
}

async function runVerify(member) {
  // Give verified role
}

// thanks https://codepen.io/guanqi/pen/mdbXQOJ for the captcha generation code
async function generateCaptcha() {
  let showNum = [];
  let canvasWidth = 150;
  let canvasHeight = 30;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  let context = canvas.getContext("2d");

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  context.fillStyle = colors.main;
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  let sCode =
    "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,0,1,2,3,4,5,6,7,8,9,!,@,#,$,%,^,&,*,(,)";
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
    context.moveTo(Math.random() * canvasWidth, Math.random() * canvasHeight);
    context.lineTo(Math.random() * canvasWidth, Math.random() * canvasHeight);
    context.stroke();
  }
  for (let i = 0; i < 30; i++) {
    context.strokeStyle = randomColor();
    context.beginPath();
    let x = Math.random() * canvasWidth;
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

module.exports = { verifyMessage };
