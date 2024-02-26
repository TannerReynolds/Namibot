/**
 * @fileoverview This file serves as the entry point for the Discord Moderation Bot.
 * It initializes the necessary libraries, sets up event handlers, and handles interactions and commands.
 */

//////////////////////////////////////
// external lib requires

const { Client, Events, Collection, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, ChannelType, InteractionType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const helmet = require('helmet');
const axios = require('axios');

//////////////////////////////////////
// Internal requires

// Event handlers for message creation, deletion, bulk deletion, and editing
const mCreate = './events/messageCreate/';
const mDelete = './events/messageDelete/';
const mBulkDelete = './events/messageDeleteBulk/';
const mEdit = './events/messageEdit/';

// Event handlers for guild member addition, every minute, and every hour
const gMemberAdd = './events/guildMemberAdd/';
const gBanAdd = './events/guildBanAdd/';
const gBanRemove = './events/guildBanRemove/';
const cDelete = './events/channelDelete/';
const gMemberUpdate = './events/guildMemberUpdate/';
const interactionCreate = './events/interactionCreate/';
const buttons = './events/interactionCreate/buttons/';
const modals = './events/interactionCreate/modals/';
const minute = './events/everyMinute/';
const hour = './events/everyHour/';

// Utility functions
const utils = './utils/';

// Server-related files
const serverDir = './server/';

// Configuration file
const { token, colors, guilds, server, status } = require('./config.js');

// Importing various utility functions and event handlers
const { checkAndUnbanUsers } = require(`${minute}checkBans`);
const { checkAndUnmuteUsers } = require(`${minute}checkMutes`);
const { refreshHighlightsCache } = require(`${minute}refreshHighlightsCache`);
const { gifDetector } = require(`${mCreate}gifDetector`);
const { checkForInlineURLs } = require(`${mCreate}hiddenLinkDetection`);
const { getModChannels } = require(`${utils}getModChannels`);
const { isStaff } = require(`${utils}isStaff`);
//const { updateSnipe } = require(`${mDelete}updateSnipe`);
const { checkAccountAge } = require(`${gMemberAdd}checkAccountAge`);
const { wipeFailedJoins } = require(`${hour}wipeFailedJoins`);
const { deleteModMail } = require(`${hour}deleteModMail`);
const { turtleCheck } = require(`${mCreate}turtleCheck`);
//const { unshortenMessageURLs } = require(`${mCreate}unshortenMessageURLs`);
const { fileTypeChecker } = require(`${mCreate}fileTypeChecker`);
const { deleteTurtles } = require(`${minute}deleteTurtles`);
const { antiAds } = require(`${mCreate}antiAds`);
const { checkHighlights } = require(`${mCreate}checkHighlights`);
const { deleteLog } = require(`${mDelete}deleteLog`);
const { editLog } = require(`${mEdit}editLog`);
const { initLog } = require(`${utils}initLog`);
const { initGuildMemberCache, syncMemberCache } = require(`${utils}guildMemberCacheSynch`);
const { auth } = require(`${serverDir}auth`);
const log = require(`${utils}log`);
const { bulkDeleteLog } = require(`${mBulkDelete}bulkDeleteLog`);
const { modMailServer, modMailDM } = require(`${mCreate}modMailCon`);
const { antiSpam } = require(`${mCreate}antiSpam`);
const { autoRole } = require(`${gMemberAdd}autoRole`);
const { guildBanLog } = require(`${gBanAdd}guildBanLog`);
const { guildUnbanLog } = require(`${gBanRemove}guildUnbanLog`);
const { checkBoosterStatus } = require(`${gMemberUpdate}checkBoosterStatus`);
const { interactionLog } = require(`${interactionCreate}interactionLog`);
const { confirmationButton } = require(`${buttons}confirmationButton`);
const { unbanButtonApprove } = require(`${buttons}unbanButtonApprove`);
const { unbanButtonDeny } = require(`${buttons}unbanButtonDeny`);
const { addXP } = require(`${mCreate}levels`);
const { sentimentAnalysis } = require(`${mCreate}sentimentAnalysis`);
const { antiChannelNuke, channelDeletor } = require(`${cDelete}antiChannelNuke`);
const { antiBanNuke, getBanner } = require(`${gBanAdd}antiBanNuke`);
const { reportSubmission } = require(`${modals}reportSubmission`);
const prisma = require(`${utils}prismaClient`);
const guildMemberCache = require(`${utils}guildMemberCache`);
const state = require(`${utils}sharedState`);

let prod = false;
if (process.argv[0]) {
	if (process.argv.some(arg => arg === '--dev')) {
		require('longjohn');
		state.setDebugMode(true);
		console.log('running in developer mode');
	} else {
		prod = true;
		console.log('running in production mode');
	}
} else {
	prod = true;
	console.log('running in production mode');
}

/**
 * Initial boot files.
 */
initLog();
initGuildMemberCache();

/**
 * Creates a new Discord client instance.
 */
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.AutoModerationConfiguration,
		GatewayIntentBits.AutoModerationExecution,
		GatewayIntentBits.GuildModeration,
	],
});

/**
 * Event handler for when the client is ready.
 * @param {Client} c - The client instance.
 */

client.once(Events.ClientReady, async c => {
	log.success(`Successfully connected to Discord! Logged in as ${c.user.tag}`);
	client.user.setActivity({ name: status.content, type: status.type });
	await refreshHighlightsCache(client);

	let startTime = Date.now();
	// eslint-disable-next-line no-unused-vars
	let response = await axios.get('https://discord.com/api/v9/gateway');
	let latency = Date.now() - startTime;
	log.verbose(`Discord API Response Time: ${latency}ms`);
	log.verbose(`Discord Websocket Ping: ${client.ws.ping}ms`);

	for (const guild of client.guilds.cache.values()) {
		try {
			prisma.guild
				.upsert({
					where: { id: guild.id },
					update: {},
					create: { id: guild.id },
				})
				.catch(e => {
					log.error(`Could not upsert guild (${guild.id}) into database: ${e}`);
				});
			await guild.members.fetch();
			log.success(`Cached members for guild: ${guild.name}`);
		} catch (err) {
			log.error(`Error caching members for guild: ${guild.name}\n${err}`);
		}
	}

	log.success(`Watching over ${client.guilds.cache.size} guilds and ${c.users.cache.size} users`);

	if (fs.existsSync('./restart.js')) {
		try {
			log.success('Restart successful!');
			let restartEmbed = new EmbedBuilder().setColor(colors.success).setDescription('Successfully restarted bot!').setTimestamp();
			let { channel } = require('./restart');
			client.channels.cache
				.get(channel)
				.send({ embeds: [restartEmbed] })
				.then(() => {
					fs.unlinkSync('./restart.js');
				})
				.catch(() => {
					fs.unlinkSync('./restart.js');
				});
		} catch (e) {
			fs.unlinkSync('./restart.js');
			log.error(`Error performing restart function: ${e}`);
		}
	}

	await checkAndUnbanUsers(client, getModChannels);
	await checkAndUnmuteUsers(client, getModChannels);
	await deleteTurtles();
	await wipeFailedJoins();
	await deleteModMail(client);

	setInterval(everyMinute, 30000);
	setInterval(everyHour, 3600000);

	/**
	 * Function that runs every minute.
	 * Performs various checks and updates.
	 */
	async function everyMinute() {
		await checkAndUnbanUsers(client, getModChannels);
		await checkAndUnmuteUsers(client, getModChannels);
		await deleteTurtles();
		await refreshHighlightsCache(client);
	}

	/**
	 * Function that runs every hour.
	 * Performs various checks and updates.
	 */
	async function everyHour() {
		await wipeFailedJoins();
		await deleteModMail(client);
		await syncMemberCache();
	}
});

//////////////////////////////////////
// Interaction and command handling

/**
 * Collection to store command objects.
 * @type {Collection<string, object>}
 */
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	log.verbose(`Loaded Command: ${command.data.name}`);

	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		log.warning(`The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

/**
 * Set to keep track of ratelimited commands.
 * @type {Set}
 */
const ratelimited = new Set();
const pingStaffRatelimited = new Set();

client.on(Events.InteractionCreate, async interaction => {
	try {
		if (interaction.isButton()) {
			let args = interaction.customId.split('_');
			let type = args[0];
			if (type === 'confirmation') await confirmationButton(interaction);
			//if (type === 'confirmation') return confirmationButton(interaction);
			//if (type === 'ban') return banButton(interaction);
			if (type === 'unbanApprove') return unbanButtonApprove(interaction, args);
			if (type === 'unbanDeny') return unbanButtonDeny(interaction, args);
			//if (type === 'warn') return warnButton(interaction);
			//if (type === 'mute') return muteButton(interaction);
			//if (type === 'closePost') return closePostButton(interaction);
		}
	} catch (e) {
		log.error(`Error in interactionCreate (button processing): ${e}`);
	}

	try {
		if (interaction.type === InteractionType.ModalSubmit) {
			// Modal Types
			// * report
			let args = interaction.customId.split('_');
			let modalType = args[0];
			if (modalType === 'report') return reportSubmission(interaction, args);
		}
	} catch (e) {
		log.error(`Error in interactionCreate (modal processing): ${e}`);
	}

	if (ratelimited.has(interaction.user.id)) {
		let cooldownEmbed = new EmbedBuilder().setTitle(`Please wait a few seconds before running another command!`).setColor(colors.main).setTimestamp();
		return interaction.reply({ embeds: [cooldownEmbed] });
	}
	try {
		if (interaction.guild.id && pingStaffRatelimited.has(interaction.guild.id)) {
			let cooldownEmbed = new EmbedBuilder().setTitle(`This command can only be ran once every 15 minutes in each guild`).setColor(colors.main).setTimestamp();
			return interaction.reply({ embeds: [cooldownEmbed] });
		}
	} catch (e) {
		// do nothing
	}

	ratelimited.add(interaction.user.id);
	setTimeout(() => ratelimited.delete(interaction.user.id), 5000);

	try {
		if (interaction.commandName === 'pingstaff' && interaction.guild.id) {
			pingStaffRatelimited.add(interaction.guild.id);
			setTimeout(() => pingStaffRatelimited.delete(interaction.guild.id), 900000);
		}
	} catch (e) {
		// do nothing
	}

	const command = interaction.client.commands.get(interaction.commandName);

	if (interaction.guild) {
		if (guilds[interaction.guild.id].commands[interaction.commandName]) {
			if (!guilds[interaction.guild.id].commands[interaction.commandName].enabled) {
				return interaction.reply({ content: 'This command is disabled in this server', ephemeral: true });
			}
		}
	}

	if (!command) {
		log.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
		if (interaction.guild) {
			if (guilds[interaction.guild.id].logs.interactionCreate) interactionLog(interaction);
		}
	} catch (error) {
		log.error(error);
		await interaction
			.editReply({
				content: `There was an error while executing this command: ${error}`,
				ephemeral: true,
			})
			.catch(e => {
				interaction.reply({
					content: `There was an error while executing this command: ${e}`,
					ephemeral: true,
				});
			});
	}
});

//////////////////////////////////////

let channelDeletesRapid = new Set();
let channelDeletesSlow = new Map();
client.on(Events.ChannelDelete, async channel => {
	if (guilds[channel.guild.id].features.antiNuke.enabled) {
		let deletor = await channelDeletor(channel);
		if (channelDeletesRapid.has(deletor.id)) {
			return antiChannelNuke(channel, deletor);
		}
		channelDeletesRapid.add(deletor.id);
		setTimeout(() => channelDeletesRapid.delete(deletor.id), 1_500);

		let slowCount = channelDeletesSlow.get(deletor.id) || 0;
		if (slowCount === 4) {
			return antiChannelNuke(channel, deletor);
		}
		channelDeletesSlow.set(deletor.id, slowCount + 1);
		setTimeout(() => channelDeletesSlow.set(deletor.id, 0), 30_000);
	}
});

client.on(Events.ThreadDelete, async channel => {
	if (guilds[channel.guild.id].features.modMail) {
		let mail = await prisma.mail.findFirst({ where: { postID: channel.id } });
		if (!mail) return;
		await prisma.mail
			.delete({
				where: {
					postID: channel.id,
				},
			})
			.then(() => {
				channel.client.users.cache
					.get(mail.userID)
					.send(`Your mod mail connection in ${channel.guild.name} has been closed by a staff member.`)
					.catch(e => {
						log.error(e);
					});
			})
			.catch(e => {
				log.error(`Error deleting mod mail: ${e}`);
			});
	}
});

client.on(Events.GuildMemberAdd, async member => {
	if (guilds[member.guild.id].features.checkAccountAge.enabled) checkAccountAge(member);
	if (guilds[member.guild.id].features.autoRole.enabled) autoRole(member);
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
	if (guilds[newMember.guild.id].features.nitroRoles.enabled) checkBoosterStatus(oldMember, newMember);
});

let banTracker = new Map();
client.on(Events.GuildBanAdd, async ban => {
	if (guilds[ban.guild.id].logs.guildBanAdd) guildBanLog(ban);
	if (guilds[ban.guild.id].features.antiNuke.enabled) {
		let banner = await getBanner(ban);
		let slowCount = banTracker.get(banner.id) || 0;
		if (slowCount === 10) {
			return antiBanNuke(ban, banner);
		}
		banTracker.set(banner.id, slowCount + 1);
		setTimeout(() => banTracker.set(banner.id, 0), 60_000);
	}
});

client.on(Events.GuildBanRemove, async ban => {
	if (guilds[ban.guild.id].logs.guildBanRemove) guildUnbanLog(ban);
});

client.on(Events.GuildCreate, async guild => {
	prisma.guild
		.upsert({
			where: { id: guild.id },
			update: {},
			create: { id: guild.id },
		})
		.then(() => {
			log.success(`Joined guild (${guild.id}) and added it to database!`);
		})
		.catch(e => {
			log.error(`Could not upsert guild (${guild.id}) into database: ${e}`);
		});
});

//////////////////////////////////////
// Message events

client.on(Events.ThreadUpdate, async (oldThread, newThread) => {
	if (newThread.locked || newThread.archived) {
		if (guilds[newThread.guild.id].features.modMail) {
			let mail = await prisma.mail.findFirst({ where: { postID: newThread.id } });
			if (!mail) return;
			await prisma.mail
				.delete({
					where: {
						postID: newThread.id,
					},
				})
				.then(() => {
					newThread.client.users.cache
						.get(mail.userID)
						.send(`Your mod mail connection in ${newThread.guild.name} has been closed by a staff member.`)
						.catch(e => {
							log.error(e);
						});
				})
				.catch(e => {
					log.error(`Error deleting mod mail: ${e}`);
				});
		}
	}
});

client.on(Events.MessageBulkDelete, async (messages, channel) => {
	if (guilds[channel.guild.id].logs.messageDeleteBulk && server.enabled) {
		await bulkDeleteLog(messages, channel, client);
	}
});

client.on(Events.MessageUpdate, async (oldMessage, message) => {
	if (!message.guild) return;
	if (message.author.bot) return;
	try {
		if (guilds[message.guild.id].features.antiAds.enabled) await antiAds(message);
		let guildMember = false;
		try {
			guildMember = await message.guild.members.fetch(message.author.id);
		} catch (e) {
			// do nothing
		}
		let isStaffBool = await isStaff(message, guildMember, PermissionFlagsBits.ManageMessages);
		await messageEvents(isStaffBool, message, oldMessage);
		if (guilds[message.guild.id].logs.messageUpdate) await editLog(message, oldMessage);
	} catch (e) {
		log.error(`Error in messageUpdate event: ${e}`);
	}
});

const recentChatter = new Set();

client.on(Events.MessageCreate, async message => {
	if (message.author.bot) return;

	if (message.channel.type !== ChannelType.DM) {
		if (guilds[message.guild.id].features.modMail) {
			await modMailServer(message);
		}
	}

	await modMailDM(message);

	if (!message.guild) return;
	let guildMember = false;
	const guildID = message.guild?.id;

	try {
		guildMember = await message.guild.members.fetch(message.author.id);
	} catch (e) {
		// do nothing
	}

	let isStaffBool = false;
	try {
		isStaffBool = await isStaff(message, guildMember, PermissionFlagsBits.ManageMessages);
	} catch (e) {
		// do nothing
	}

	if (guilds[guildID].features.antiAds.enabled) await antiAds(message);

	if (guilds[guildID].features.antiSpam && !isStaffBool) await antiSpam(message);

	await messageEvents(isStaffBool, message, guildMember);

	try {
		if (!guildMemberCache[guildID] || !guildMemberCache[guildID][message.author.id]) {
			guildMemberCache[guildID][message.author.id] = { xp: 0, level: 1, changed: false };
		}
		if (guilds[guildID].features.levels.enabled) {
			let compositeKey = `${guildID}:${message.author.id}`;
			let totalMessages = guildMemberCache[guildID][message.author.id].totalMessages || false;
			if (!totalMessages) {
				guildMemberCache[guildID][message.author.id].totalMessages = 1;
			} else {
				guildMemberCache[guildID][message.author.id].totalMessages += 1;
			}
			if (!recentChatter.has(compositeKey)) {
				await addXP(guildID, message.author.id, message);
				recentChatter.add(compositeKey);
				setTimeout(() => recentChatter.delete(compositeKey), 60_000);
			}
		} else {
			let totalMessages = guildMemberCache[guildID][message.author.id].totalMessages || false;
			if (!totalMessages) {
				guildMemberCache[guildID][message.author.id].totalMessages = 1;
			} else {
				guildMemberCache[guildID][message.author.id].totalMessages += 1;
			}
			if (!guildMemberCache[guildID][message.author.id].changed) guildMemberCache[guildID][message.author.id].changed = true;
		}
	} catch (e) {
		log.error(`Error in messageCreate (levels): ${e}`);
	}

	await checkHighlights(message);

	if (guilds[guildID].features.sentimentAnalysis.enabled) await sentimentAnalysis(message);
});

client.on(Events.MessageDelete, async message => {
	if (!message.guild) return;
	if (message.author.bot) return;
	try {
		if (guilds[message.guild.id].logs.messageDelete) await deleteLog(message);
	} catch (e) {
		log.error(`Error in messageDelete event: ${e}`);
	}
});

async function messageEvents(isStaffBool, message, guildMember, oldMessage) {
	if (!message.guild) return;

	try {
		const guildID = message.guild?.id;

		let content = message.content || 'N/A';
		if (guilds[guildID].features.fileTypeChecker) await fileTypeChecker(message);

		await turtleCheck(message, guildMember);

		//Ignoring staff
		if (!isStaffBool) {
			if (guilds[guildID].features.gifDetector.enabled) await gifDetector(message);
		}
		if (!oldMessage) oldMessage = false;
		//Not ignoring staff
		if (guilds[guildID].features.hiddenLinkDetection) await checkForInlineURLs(client, content, message, oldMessage);
	} catch (e) {
		log.error(`Error in messageEvents function: ${e}`);
	}
}

client.login(token);

if (server.enabled) {
	app.set('view engine', 'ejs');
	app.set('views', './server/views');
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(
		helmet({
			contentSecurityPolicy: false,
		})
	);

	app.get('/heartbeat', (req, res) => {
		res.status(200).send('OK');
	});

	app.use((req, res, next) => {
		if (req.path.startsWith('/bdl')) {
			const originalUrl = encodeURIComponent(req.originalUrl);
			res.redirect(`${server.url}/auth?bdl=${originalUrl}`);
			next();
		} else {
			next();
		}
	});

	app.post('/auth', (req, res) => {
		log.verbose('auth requested');
		res.setHeader('Content-Type', 'text/html');
		return auth(req, res);
	});

	app.use(
		express.static('./server/public', {
			extensions: ['html', 'htm', 'css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'json', 'txt'],
		})
	);
	app.use(
		express.static('./server/views', {
			extensions: ['css'],
		})
	);

	app.listen(server.PORT, '0.0.0.0', () => {
		log.success(`Local server listening on port ${server.PORT} at ${server.url}`);
		if (prod) {
			setTimeout(() => {
				axios
					.post('http://localhost:3661/register', { pid: process.pid })
					.then(response => log.success(response.data.message))
					.catch(error => log.error('Failed to register with monitor app:', error.message));
			}, 3000);
		}
	});
}

process.on('uncaughtException', async err => {
	log.error(err.stack);
	log.debug(`Err: ${err}`);
	log.debug(`Err Stack: ${err.stack}`);
	await syncMemberCache();
	await log.writeDebugLogs();
});

process.on('SIGINT', async () => {
	log.verbose('Caught SIGINT... Exiting');
	log.debug('Caught SIGINT... Exiting');
	await syncMemberCache();
	await log.writeDebugLogs();
	await prisma.$disconnect();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	log.verbose('Caught SIGTERM... Exiting');
	log.debug('Caught SIGTERM... Exiting');
	await syncMemberCache();
	await log.writeDebugLogs();
	await prisma.$disconnect();
	process.exit(0);
});
