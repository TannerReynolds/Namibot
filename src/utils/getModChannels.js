const log = require('./log');
const { guilds } = require('../config');
function getModChannels(client, id) {
	try {
		return {
			main: client.guilds.cache.get(id).channels.cache.get(guilds[id].mainLogChannelID),
			secondary: client.guilds.cache.get(id).channels.cache.get(guilds[id].secondaryLogChannelID),
		};
	} catch (e) {
		return log.error(`Error getting mod channels: ${e}`);
	}
}

module.exports = { getModChannels };
