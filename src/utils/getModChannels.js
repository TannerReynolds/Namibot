const { guilds } = require('../config.json');
function getModChannels(client, id) {
	if (id === '438650836512669699') {
		// TCC
		return {
			main: client.guilds.cache.get('438650836512669699').channels.cache.get(guilds['438650836512669699'].mainLogChannelID),
			secondary: client.guilds.cache.get('438650836512669699').channels.cache.get(guilds['438650836512669699'].secondaryLogChannelID),
		};
	}
	if (id === '1061175459112550490') {
		// Learn Japanese
		return {
			main: client.guilds.cache.get('1061175459112550490').channels.cache.get(guilds['1061175459112550490'].mainLogChannelID),
			secondary: client.guilds.cache.get('1061175459112550490').channels.cache.get(guilds['1061175459112550490'].secondaryLogChannelID),
		};
	}
	if (id === '1190156169961029774') {
		// Bot Test Server
		return {
			main: client.guilds.cache.get('1190156169961029774').channels.cache.get(guilds['1190156169961029774'].mainLogChannelID),
			secondary: client.guilds.cache.get('1190156169961029774').channels.cache.get(guilds['1190156169961029774'].secondaryLogChannelID),
		};
	}
	return 'ERROR: NO CHANNEL FOUND FOR SPECIFIED GUILD';
}

module.exports = { getModChannels };
