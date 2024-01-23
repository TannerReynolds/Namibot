//////////////////////////////////////
// external lib requires
const { Client, Events, Collection, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

//////////////////////////////////////
// Internal requires
const mCreate = './events/messageCreate/';
const mDelete = './events/messageDelete/';
const mEdit = './events/messageEdit/';
const gMemberAdd = './events/guildMemberAdd/';
const minute = './events/everyMinute/';
const hour = './events/everyHour/';
const utils = './utils/';
const colors = require(`${utils}embedColors`);
const { token } = require('./config.json');
const { checkAndUnbanUsers } = require(`${minute}checkBans`);
const { checkAndUnmuteUsers } = require(`${minute}checkMutes`);
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

	checkAndUnbanUsers(client, getModChannels);
	checkAndUnmuteUsers(client, getModChannels);
	deleteTurtles();
	wipeFailedJoins();

	setInterval(everyMinute, 30000);
	setInterval(everyHour, 3600000);

	function everyMinute() {
		checkAndUnbanUsers(client, getModChannels);
		checkAndUnmuteUsers(client, getModChannels);
		deleteTurtles();
	}
	function everyHour() {
		wipeFailedJoins();
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

	if (!command) {
		log.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		log.error(error);
		await interaction.reply({
			content: 'There was an error while executing this command!',
			ephemeral: true,
		});
	}
});

//////////////////////////////////////
// Join/Leave Events

client.on(Events.GuildMemberAdd, async member => {
	checkAccountAge(member);
});

//////////////////////////////////////
// Message events

client.on(Events.MessageUpdate, async (oldMessage, message) => {
	antiAds(message);
	messageEvents(message, oldMessage);
	editLog(message, oldMessage);
});

client.on(Events.MessageCreate, async message => {
	antiAds(message);
	messageEvents(message);
	checkHighlights(message);
});

client.on(Events.MessageDelete, async message => {
	//updateSnipe(message);
	deleteLog(message);
});

async function messageEvents(message, oldMessage) {
	if (!message.guild) return;
	if (message.author.bot) return;
	let content = message.content;
	let guildMember = await message.guild.members.fetch(message.author.id);
	fileTypeChecker(message);
	turtleCheck(message, guildMember);
	//Ignoring staff
	if (!isStaff(message, guildMember, PermissionFlagsBits.ManageMessages)) {
		gifDetector(message);
	}
	//Not ignoring staff
	await checkForInlineURLs(client, content, message, getModChannels);
}

client.login(token);

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
