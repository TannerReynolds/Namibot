const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function turtleCheck(message, guildMember) {
  let turtled = await prisma.turtleMode.findUnique({
    where: {
      userID_guildId: {
        userID: message.author.id,
        guildId: message.guild.id,
      },
    },
  });

  if (!turtled) {
    return;
  } else {
    guildMember.timeout(
      turtled.interval * 1000,
      "Automated TurtleMode Timeout"
    );
  }
}

module.exports = { turtleCheck };
