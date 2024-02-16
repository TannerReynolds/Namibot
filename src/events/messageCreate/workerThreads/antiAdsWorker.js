const { parentPort } = require('worker_threads');

parentPort.on('message', ({ guilds, content, guildID }) => {
    let regex = /discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+/gim;
	let sentInvite = content.match(regex);
	if (!sentInvite) {
		return parentPort.postMessage(false);
	}

    let currentInvite = guilds[guildID].invite.match(regex)[0];

	if (currentInvite === sentInvite[0] && !sentInvite[1]) {
		return parentPort.postMessage(false);
	}

	let allowed = guilds[guildID].features.antiAds.allowedInvites;

	if (allowed.some(allowedInvite => sentInvite[0] === allowedInvite) && !sentInvite[1]) {
		return parentPort.postMessage(false);
	}
    parentPort.postMessage(sentInvite[0]);
});