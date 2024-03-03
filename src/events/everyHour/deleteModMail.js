const prisma = require("../../utils/prismaClient");
const log = require("../../utils/log");

async function deleteModMail(client) {
  log.debug("begin");
  try {
    let now = new Date();

    let expiredMail = await prisma.mail
      .findMany({
        where: {
          date: {
            lt: now,
          },
        },
      })
      .catch(() => {
        log.error(`Couldn't get expiredMail`);
      });

    if (!expiredMail) return;

    for (let m of expiredMail) {
      await prisma.mail
        .delete({
          where: {
            postID: m.postID,
          },
        })
        .then(() => {
          let user = client.users.cache.get(m.userID);
          if (!user) return;
          user
            .send(
              `Your mod mail connection in ${client.guilds.cache.get(m.guildId).name} has been deleted due to inactivity.`,
            )
            .catch((e) => {
              // do nothing
            });
        })
        .catch((e) => {
          log.error(e);
        });
    }
  } catch (error) {
    return log.error(`Failed to delete mod mails: ${error}`);
  }
  log.debug("end");
}

module.exports = { deleteModMail };
