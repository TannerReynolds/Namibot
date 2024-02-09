async function channelRefresh(channel) {
	if (!channel.guild.me.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
		console.log('The bot does not have permission to manage channels.');
		return;
	}

	const channelOptions = {
		type: channel.type,
		topic: channel.topic,
		nsfw: channel.nsfw,
		bitrate: channel.bitrate,
		userLimit: channel.userLimit,
		rateLimitPerUser: channel.rateLimitPerUser,
		position: channel.position,
		permissionOverwrites: channel.permissionOverwrites.cache,
		parent: channel.parent,
	};

	const channelName = channel.name;

	await channel
		.delete('Cloning channel for refresh')
		.then(() => console.log(`Deleted channel ${channelName}`))
		.catch(console.error);

	channel.guild.channels
		.create(channelName, channelOptions)
		.then(newChannel => console.log(`Created new channel ${newChannel.name}`))
		.catch(console.error);
}

module.exports = { channelRefresh };
