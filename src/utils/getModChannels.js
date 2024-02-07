const { guilds } = require('../config');
function getModChannels(client, id) {
		return {
			main: client.guilds.cache.get(id).channels.cache.get(guilds[id].mainLogChannelID),
			secondary: client.guilds.cache.get(id).channels.cache.get(guilds[id].secondaryLogChannelID),
		};
}

module.exports = { getModChannels };
