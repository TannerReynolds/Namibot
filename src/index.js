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
const { updateSnipe } = require(`${mDelete}updateSnipe`);
const { checkAccountAge } = require(`${gMemberAdd}checkAccountAge`);
const { wipeFailedJoins } = require(`${hour}wipeFailedJoins`);
const { turtleCheck } = require(`${mCreate}turtleCheck`);
const { deleteTurtles } = require(`${minute}deleteTurtles`);
const { antiAds } = require(`${mCreate}antiAds`);
const { deleteLog } = require(`${mDelete}deleteLog`);
const { editLog } = require(`${mEdit}editLog`);

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.AutoModerationConfiguration,
	],
});

client.once(Events.ClientReady, async c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	client.user.setActivity('you', { type: 'WATCHING' });

	for (const guild of client.guilds.cache.values()) {
		try {
			await guild.members.fetch();
			console.log(`Cached members for guild: ${guild.name}`);
		} catch (err) {
			console.error(`Error caching members for guild: ${guild.name}`, err);
		}
	}

	checkAndUnbanUsers(client, getModChannels);
	checkAndUnmuteUsers(client, getModChannels);
	deleteTurtles();
	wipeFailedJoins();

	setInterval(everyMinute, 60000);
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

	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const ratelimited = new Set();

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	if (ratelimited.has(interaction.user.id)) {
		let cooldownEmbed = new EmbedBuilder().setTitle(`Please wait a few seconds before running another command!`).setColor(colors.main).setTimestamp();
		return interaction.reply({ embeds: [cooldownEmbed] });
	}

	ratelimited.add(interaction.user.id);
	setTimeout(() => ratelimited.delete(interaction.user.id), 5000);

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
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
});

client.on(Events.MessageDelete, async message => {
	updateSnipe(message);
	deleteLog(message);
});

async function messageEvents(message, oldMessage) {
	if (!message.guild) return;
	if (message.author.bot) return;
	let content = message.content;
	let guildMember = await message.guild.members.fetch(message.author.id);
	turtleCheck(message, guildMember);
	//Ignoring staff
	if (!isStaff(message, guildMember, PermissionFlagsBits.ManageMessages)) {
		gifDetector(message);
	}
	//Not ignoring staff
	await checkForInlineURLs(client, content, message, getModChannels);
}

client.login(token);

process.on('unhandledRejection', async err => console.log(err.stack));
process.on('uncaughtException', async err => console.log(err.stack));
