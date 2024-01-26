//////////////////////////////////////
// external lib requires
const { Client, Events, Collection, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const helmet = require('helmet');

//////////////////////////////////////
// Internal requires
const mCreate = './events/messageCreate/';
const mDelete = './events/messageDelete/';
const mBulkDelete = './events/messageDeleteBulk/';
const mEdit = './events/messageEdit/';
const gMemberAdd = './events/guildMemberAdd/';
const minute = './events/everyMinute/';
const hour = './events/everyHour/';
const utils = './utils/';
const { token, colors, guilds, server } = require('./config.json');
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
const { turtleCheck } = require(`${mCreate}turtleCheck`);
const { fileTypeChecker } = require(`${mCreate}fileTypeChecker`);
const { deleteTurtles } = require(`${minute}deleteTurtles`);
const { antiAds } = require(`${mCreate}antiAds`);
const { checkHighlights } = require(`${mCreate}checkHighlights`);
const { deleteLog } = require(`${mDelete}deleteLog`);
const { editLog } = require(`${mEdit}editLog`);
const { initLog } = require(`${utils}initLog`);
const log = require(`${utils}log`);
const { bulkDeleteLog } = require(`${mBulkDelete}bulkDeleteLog`);
const axios = require('axios');

initLog();

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

client.once(Events.ClientReady, async c => {
	log.success(`Successfully connected to Discord! Logged in as ${c.user.tag}`);
	client.user.setActivity({ name: 'over everyone', type: 3 });
	await refreshHighlightsCache(client);

	let startTime = Date.now();
	let response = await axios.get('https://discord.com/api/v9/gateway');
	let latency = Date.now() - startTime;
	log.verbose(`Discord API Response Time: ${latency}ms`);
	log.verbose(`Discord Websocket Ping: ${client.ws.ping}ms`);

	for (const guild of client.guilds.cache.values()) {
		try {
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
	client.channels.cache.get(channel).send({ embeds: [restartEmbed] }).then(r => {
		fs.unlinkSync('./restart.js');
	}).catch(e => {
		fs.unlinkSync('./restart.js');
	})
	}
	catch(e) {
		fs.unlinkSync('./restart.js');
		log.error(`Error performing restart function: ${e}`)
	}
  }

	await checkAndUnbanUsers(client, getModChannels);
	await checkAndUnmuteUsers(client, getModChannels);
	await deleteTurtles();
	await wipeFailedJoins();

	setInterval(everyMinute, 30000);
	setInterval(everyHour, 3600000);

	async function everyMinute() {
		await checkAndUnbanUsers(client, getModChannels);
		await checkAndUnmuteUsers(client, getModChannels);
		await deleteTurtles();
		await refreshHighlightsCache(client);
	}
	async function everyHour() {
		await wipeFailedJoins();
	}
});

//////////////////////////////////////
// Interaction and command handling

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

const ratelimited = new Set();
const pingStaffRatelimited = new Set();

client.on(Events.InteractionCreate, async interaction => {
	//if (!interaction.isChatInputCommand()) return;

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
		log.debug('interaction not sent in guild');
	}

	ratelimited.add(interaction.user.id);
	setTimeout(() => ratelimited.delete(interaction.user.id), 5000);

	try {
		if (interaction.commandName === 'pingstaff' && interaction.guild.id) {
			pingStaffRatelimited.add(interaction.guild.id);
			setTimeout(() => pingStaffRatelimited.delete(interaction.guild.id), 900000);
		}
	} catch (e) {
		log.debug('interaction not sent in guild');
	}

	const command = interaction.client.commands.get(interaction.commandName);

	if (interaction.guild) {
		if (!guilds[interaction.guild.id].commands[interaction.commandName]) {
			log.debug(`Command ${interaction.commandName} is disabled in this server`);
			return interaction.reply({ content: 'This command is disabled in this server', ephemeral: true });
		}
	}

	if (!command) {
		log.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		log.error(error);
		await interaction
			.reply({
				content: `There was an error while executing this command: ${error}`,
				ephemeral: true,
			})
			.catch(e => {
				interaction.editReply({
					content: `There was an error while executing this command: ${e}`,
					ephemeral: true,
				});
			});
	}
});

//////////////////////////////////////
// Join/Leave Events

client.on(Events.GuildMemberAdd, async member => {
	if (guilds[member.guild.id].features.checkAccountAge) await checkAccountAge(member);
});

//////////////////////////////////////
// Message events

client.on(Events.MessageBulkDelete, async (messages, channel) => {
	log.verbose('yes');
	if (guilds[channel.guild.id].logs.messageDeleteBulk && server.enabled) {
		log.verbose('yes');
		await bulkDeleteLog(messages, channel, client);
	}
});

client.on(Events.MessageUpdate, async (oldMessage, message) => {
	if (!message.guild) return;
	if (message.author.bot) return;
	if (guilds[message.guild.id].features.antiAds) await antiAds(message);
	await messageEvents(message, oldMessage);
	if (guilds[message.guild.id].logs.messageUpdate) await editLog(message, oldMessage);
});

client.on(Events.MessageCreate, async message => {
	if (!message.guild) return;
	if (message.author.bot) return;
	if (guilds[message.guild.id].features.antiAds) await antiAds(message);
	await messageEvents(message);
	await checkHighlights(message);
});

client.on(Events.MessageDelete, async message => {
	if (!message.guild) return;
	if (message.author.bot) return;
	//updateSnipe(message);
	if (guilds[message.guild.id].logs.messageDelete) await deleteLog(message);
});

async function messageEvents(message, oldMessage) {
	if (!message.guild) return;
	if (message.author.bot) return;
	let content = message.content || 'N/A';
	let guildMember = false;
	try {
		guildMember = await message.guild.members.fetch(message.author.id);
	} catch (e) {
		log.debug(`User is not a member of this guild: ${e}`);
	}
	if (guilds[message.guild.id].features.fileTypeChecker) await fileTypeChecker(message);
	await turtleCheck(message, guildMember);
	//Ignoring staff
	if (!isStaff(message, guildMember, PermissionFlagsBits.ManageMessages)) {
		if (guilds[message.guild.id].features.gifDetector) await gifDetector(message);
	}
	//Not ignoring staff
	if (guilds[message.guild.id].features.hiddenLinkDetection) await checkForInlineURLs(client, content, message, getModChannels);
}

client.login(token);

if (server.enabled) {
	app.set('view engine', 'ejs');
	app.set('views', './server/views');
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					scriptSrc: ["'self'", 'https://cdn.tailwindcss.com'],
					imgSrc: ["'self'", 'data:', 'https://cdn.discordapp.com', 'https://images-ext-1.discordapp.net'],
				},
			},
		})
	);

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

	app.listen(server.port, '0.0.0.0', () => {
		log.success(`Local server listening on port ${server.port} at ${server.url}`);
	});
}

const fg = {
	red: '\x1b[31m',
};
const bg = {
	red: '\x1b[41m',
};
const endColor = '\x1b[0m';
const beginningArrow = `${fg.red}  |> ${endColor}`;
process.on('unhandledRejection', async err => {
	console.log(`${beginningArrow}${bg.red}[${timestamp()}]${endColor}${fg.red} | ${err.stack}${endColor}`);
});
process.on('uncaughtException', async err => {
	console.log(`${beginningArrow}${bg.red}[${timestamp()}]${endColor}${fg.red} | ${err.stack}${endColor}`);
});

function timestamp() {
	const time = new Date();
	return time.toLocaleString('en-US', {
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: true,
	});
}
