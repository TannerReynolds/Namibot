// Overview of types of values:
// String: Strings are encased in ''. Any text or snowflake (Discord ID) is a string and needs to be encased in '' or "".
// Number: Numbers are not enclosed in ''. They are just numbers and are not interpreted by the bot the same way that strings are.
// Array: Array is just a list of other types. Could be numbers, strings, or objects. each item is separated by a comma. Example: [ 'first ID', 'second ID' ]
// Object: Objects are, in this case, structures with a key and value pair. Key is the first item, value is the second item. There can also be arrays of objects.
// Boolean: Booleans are just true or false. Do NOT encase them with '' or "". They are meant to just be true or false by themselves.
// This guide can help you create a bot and invite it to your server: https://discordjs.guide/preparations/setting-up-a-bot-application.html
// This site can help you create an invite link for your bot: https://discordapi.com/permissions.html
// This bot was coded to only work on servers that are configured here. Do not make your bot public, it will only create errors and break things.
// Make sure you have created a config.js file before running the bot. The bot will not run using only the example.config.js file.
const config = {
	token: '.', // Follow this guide to create your bot and get it's token/invite it to your server: https://discordjs.guide/preparations/setting-up-a-bot-application.html
	clientId: '1104630573772841070', // The ID of your bot, you can get this from your bot's application page
	guildId: '1190156169961029774', // Main guild ID the bot will be used in, this is used in the devDeploy command, which deploys commands specifically to the developer server ONLY.
	botOwnerID: '478044823882825748', // Your user ID.
	appealServer: 'https://discord.gg/wJhppSMHpG', // A full invite link to the server that your bot will use for appeals.
	// This is required for the appeal command to work bc your bot cannot recieve commands unless it shares
	// at least one server with the person running the command.
	status: { type: 3, content: 'over everyone' }, // The bot's activity message. Types: 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching, 4 = Custom, 5 = Competing
	colors: {
		success: '#66de98', // Color that success embeds use
		error: '#FF6961', //Color for error embeds
		main: '#6C4678', // Color for most embeds
		warning: '#f5f562', // Color for warning embeds
	},
	emojis: {
		// To get these emoji codes, you can type a message in Discord of that emoji, then right click and select "Copy text"
		sent: '<:sent:1203188998097604608>', // Emoji indicating that your message has been sent to the intended user
		yes: '<:check:1203191199251300402>', // Emoji used for polls
		no: '<:x_:1203191562084032594>', // Emoji used for polls
		success: '<:check:1203191199251300402>', // Emoji used for success
		error: '<:x_:1203191562084032594>', // Emoji used for errors
	},
	server: {
		enabled: true, // Do not enable this unless you know what you're doing. The log functionality still works without using a server.
		port: 1746, // Number of the port for the server to listen on
		url: 'https://learn.tokyo.jp/fern', // URL this bot is pointing to
	},
	guilds: {
		'438650836512669699': {
			// This line is your guild's ID
			name: 'The Car Community', // Your guild's name
			invite: 'https://discord.gg/cars', // The main invite to your guild
			guildID: '438650836512669699', // Your guild ID again
			mainLogChannelID: '583434851852746776', // The main log channel ID. Used for important logs
			secondaryLogChannelID: '655047046557859851', // Secondary log channel ID. Used for logs that aren't as important.
			botCommandsChannelID: '438652906116481025', // Bot command channel ID, so that normal users can't run utility commands outside of the designated channel
			mailChannelID: '1202038197698449450', // The FORUM channel that you have for incoming mod mails and appeals
			staffRoleID: '499564155884535808', // The role of your staff. This is used as an override for when people need to run moderation commands
			// but dont have dangerous permissions like BanMembers and KickMembers
			muteRoleID: '819300268628770837', // The ID of your muted role. Only necessary if you have the mute command enabled
			logs: {
				// Enable specific types of logs for your server
				messageDelete: true,
				messageUpdate: true,
				messageDeleteBulk: true, // This event fires when members are banned or their messages are purged
				guildBanAdd: true,
				guildBanRemove: true,
			},
			features: {
				// Enable and configure bot features for your server
				checkAccountAge: {
					enabled: true, // This will kick members that have accounts newer than x amount of days
					days: 7, // Number of the days old the account must be to join your server
				},
				antiAds: {
					// Stops people from sending advertisements to other Discord servers when enabled and automatically warns them
					enabled: true, // When warned for advertising, the user will be timed out for 10 minutes to stop spam and give moderators time to respond
					allowedInvites: ['https://discord.gg/cars', 'https://discord.gg/learnjapanese'], // Invites people will be allowed to send.
				},
				bannedWordFilter: true, //
				fileTypeChecker: true, // Check messages for dangerous/potentially malicious filetypes. Files such as .exe, .js, .bat, etc.
				gifDetector: {
					enabled: true, // Stop any and all gifs being sent (staff can bypass this)
					allowedChannels: ['438653183464701963', '438652906116481025', '1197694320346665140'], // Channels that everybody is allowed to send gifs in
				},
				hiddenLinkDetection: true, // Detect and expose inline URLs when they are sent: Example: [steamcommunity.com/gift/asdjhg8](https://myscamwebsite.com)
				antiSpam: true, // Stop various types of spamming and automatically warn/timeout users
				modMail: true, // Allow people to create mod mail connections to the server. This is required for appeals to work.
				autoRole: {
					enabled: true, // Give a role automatically when a user joins the server
					roles: ['573167869433610251'], // Array of role IDs. Example: ['573167869433610251', 'some other id here]
				},
				levels: {
					// Levelling system for the bot
					enabled: false,
					levelUpMessage: 'You have leveled up to level {{level}}!', // Level up message, use {{level}} as a placeholder for the member's level.
					generateLevelImage: true, // Whether or not to generate an image with the level up message
					levelRoles: {
						// Object of your levels. the key should be a string of the level,
						// and the value should be the role ID for that level's role. You can leave this blank if you dont want level roles but still want a levelling system
						1: '1203186738898665533',
						10: '1203186765289234523',
						20: '1203186804828930108',
						30: '1203186840639905832',
						40: '1203186865398747166',
						50: '1203186889637629983',
					},
				},
				nitroRoles: {
					enabled: true, // Special roles locked to nitro boosters only. Maximum of 25 roles.
					roles: [
						{ emoji: '', id: '' }, // Array of objects. Key is the emoji (Same as the emoji codes above), value is the role ID.
					],
				},
				selfRoles: {
					enabled: false, // Roles that anybody could give themselves. Maximum of 25 roles
					roles: [
						{ emoji: '', id: '' }, // Array of objects. Key is the emoji (Same as the emoji codes above), value is the role ID.
					],
				},
				aiModeration: {
					enabled: true, // Enable AI moderation. This will use OpenAI's GPT-3 to moderate messages. YOU NEED AN API KEY TO USE THIS
				},
			},
			commands: {
				// Full list of commands allowing you to enable them or disable them.
				reload: true,
				sendembed: true,
				dangerroles: true,
				unshort: true,
				purge: true,
				modmail: true,
				addhighlight: true,
				appeal: true,
				av: true,
				bam: true,
				ban: true,
				bannedwords: true,
				colorme: true,
				'Get Avatar': true,
				debugmode: true,
				delhighlight: true,
				delwarn: true,
				eval: true,
				gay: true,
				getlogpassword: true,
				giverole: true,
				highlights: true,
				id: true,
				kick: true,
				managenitrocolor: true,
				mute: true,
				newtag: true,
				t: true,
				deltag: true,
				tags: true,
				ping: true,
				realverification: true,
				removerole: true,
				rng: true,
				senddm: true,
				turtlemode: true,
				unban: true,
				unmute: true,
				unturtle: true,
				warn: true,
				warns: true,
			},
		},
		'1061175459112550490': {
			// Extra servers can be added just by copying the object above and filling out the information
			name: 'Learn Japanese',
			invite: 'https://discord.gg/learnjapanese',
			guildID: '1061175459112550490',
			mainLogChannelID: '1083910377680687134',
			secondaryLogChannelID: '1193360741198217246',
			botCommandsChannelID: '1075661557247246357',
			mailChannelID: '1061182094266609724',
			staffRoleID: '1061181030813413468',
			muteRoleID: '1174259360541708299',
			logs: {
				messageDelete: true,
				messageUpdate: true,
				messageDeleteBulk: true,
				guildBanAdd: true,
				guildBanRemove: true,
			},
			features: {
				checkAccountAge: {
					enabled: true,
					days: 7,
				},
				antiAds: {
					enabled: true,
					allowedInvites: ['https://discord.gg/cars', 'https://discord.gg/learnjapanese'],
				},
				bannedWordFilter: true,
				fileTypeChecker: true,
				gifDetector: {
					enabled: true,
					allowedChannels: ['438653183464701963', '438652906116481025', '1197694320346665140'],
				},
				hiddenLinkDetection: true,
				antiSpam: true,
				modMail: true,
				autoRole: {
					enabled: true,
					roles: ['1087482841731956917'],
				},
				levels: {
					enabled: true,
					levelUpMessage: 'You have leveled up to level {{level}}!',
					levelRoles: {
						1: '1203186738898665533',
						10: '1203186765289234523',
						20: '1203186804828930108',
						30: '1203186840639905832',
						40: '1203186865398747166',
						50: '1203186889637629983',
					},
				},
				nitroRoles: {
					enabled: true,
					roles: [{ emoji: '', id: '' }],
				},
				selfRoles: {
					enabled: false,
					roles: [{ emoji: '', id: '' }],
				},
				aiModeration: {
					enabled: true, // Enable AI moderation. This will use OpenAI's GPT-3 to moderate messages. YOU NEED AN API KEY TO USE THIS
				},
			},
			commands: {
				reload: true,
				sendembed: true,
				dangerroles: true,
				unshort: true,
				purge: true,
				modmail: true,
				addhighlight: true,
				appeal: true,
				av: true,
				bam: true,
				ban: true,
				bannedwords: true,
				colorme: true,
				'Get Avatar': true,
				debugmode: true,
				delhighlight: true,
				delwarn: true,
				eval: true,
				gay: true,
				getlogpassword: true,
				giverole: true,
				highlights: true,
				id: true,
				kick: true,
				managenitrocolor: true,
				mute: true,
				newtag: true,
				t: true,
				deltag: true,
				tags: true,
				ping: true,
				realverification: true,
				removerole: true,
				rng: true,
				senddm: true,
				turtlemode: true,
				unban: true,
				unmute: true,
				unturtle: true,
				warn: true,
				warns: true,
			},
		},
		'1190156169961029774': {
			name: "Fern's Appeals",
			invite: 'https://discord.gg/JRqbHA5gbv',
			guildID: '1190156169961029774',
			mainLogChannelID: '1193380148104396963',
			secondaryLogChannelID: '1193380167142342667',
			botCommandsChannelID: '1190156171114446930',
			mailChannelID: '1190156171114446930',
			staffRoleID: '1193379997881217074',
			muteRoleID: '1193380020001964093',
			logs: {
				messageDelete: true,
				messageUpdate: true,
				messageDeleteBulk: true,
				guildBanAdd: true,
				guildBanRemove: true,
			},
			features: {
				checkAccountAge: {
					enabled: true,
					days: 7,
				},
				antiAds: {
					enabled: true,
					allowedInvites: ['https://discord.gg/JRqbHA5gbv'],
				},
				bannedWordFilter: true,
				fileTypeChecker: true,
				gifDetector: {
					enabled: true,
					allowedChannels: ['438653183464701963', '438652906116481025', '1197694320346665140'],
				},
				hiddenLinkDetection: true,
				antiSpam: true,
				modMail: true,
				autoRole: {
					enabled: false,
					roles: [''],
				},
				levels: {
					enabled: false,
					levelUpMessage: 'You have leveled up to level {{level}}!',
					levelRoles: {
						1: '1203186738898665533',
						10: '1203186765289234523',
						20: '1203186804828930108',
						30: '1203186840639905832',
						40: '1203186865398747166',
						50: '1203186889637629983',
					},
				},
				nitroRoles: {
					enabled: true,
					roles: [{ emoji: '', id: '' }],
				},
				selfRoles: {
					enabled: false,
					roles: [{ emoji: '', id: '' }],
				},
				aiModeration: {
					enabled: true, // Enable AI moderation. This will use OpenAI's GPT-3 to moderate messages. YOU NEED AN API KEY TO USE THIS
				},
			},
			commands: {
				reload: true,
				sendembed: true,
				dangerroles: true,
				unshort: true,
				purge: true,
				modmail: true,
				addhighlight: true,
				appeal: true,
				av: true,
				bam: false,
				ban: true,
				bannedwords: true,
				colorme: true,
				'Get Avatar': true,
				debugmode: true,
				delhighlight: true,
				delwarn: true,
				eval: true,
				gay: true,
				getlogpassword: true,
				giverole: true,
				highlights: true,
				id: true,
				kick: true,
				managenitrocolor: true,
				mute: true,
				newtag: true,
				t: true,
				deltag: true,
				tags: true,
				ping: true,
				realverification: true,
				removerole: true,
				rng: true,
				senddm: true,
				turtlemode: true,
				unban: true,
				unmute: true,
				unturtle: true,
				warn: true,
				warns: true,
			},
		},
	},
};

module.exports = config;
