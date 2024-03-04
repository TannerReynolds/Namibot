const log = require("../../../utils/log");

module.exports = ({ guilds, content, guildID }) => {
  try {
    let regex =
      /discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+/gim;
    let sentInvite = content.match(regex);
    if (!sentInvite) {
      return parentPort.postMessage(false);
    }

    let currentInvite = guilds[guildID].invite.match(regex)[0];

    if (currentInvite === sentInvite[0] && !sentInvite[1]) {
      return false;
    }

    let allowed = guilds[guildID].features.antiAds.allowedInvites;

    if (
      allowed.some((allowedInvite) => sentInvite[0] === allowedInvite) &&
      !sentInvite[1]
    ) {
      return false;
    }
    return sentInvite[0];
  } catch (e) {
    log.error(`Error in antiAdsWorker: ${e}`);
    return false;
  }
};
