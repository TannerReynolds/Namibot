//////////////////////////////////////
// external lib requires
const {
  Client,
  Events,
  Collection,
  GatewayIntentBits,
  PermissionFlagsBits,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

//////////////////////////////////////
// Internal requires
const mCreate = "./events/messageCreate/";
const mDelete = "./events/messageDelete/";
const utils = "./utils/";
const { token } = require("./config.json");
const { checkAndUnbanUsers } = require("./events/everyMinute/checkBans");
const { gifDetector } = require(`${mCreate}gifDetector`);
const { checkForInlineURLs } = require(`${mCreate}hiddenLinkDetection`);
const { getModChannels } = require(`${utils}getModChannels`);
const { isStaff } = require(`${utils}isStaff`);
const { updateSnipe } = require(`${mDelete}updateSnipe`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  client.user.setActivity("you", { type: "WATCHING" });
  setInterval(everyMinute, 60000);

  function everyMinute() {
    checkAndUnbanUsers(client, getModChannels);
  }
});

//////////////////////////////////////
// Interaction and command handling

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

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
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

//////////////////////////////////////
// Message events

client.on(Events.MessageUpdate, async (oldMessage, message) => {
  messageEvents(message, oldMessage);
});

client.on(Events.MessageCreate, async (message) => {
  messageEvents(message);
});

client.on(Events.MessageDelete, async (message) => {
  updateSnipe(message);
});

async function messageEvents(message, oldMessage) {
  let content = message.content;
  let guildMember = await message.guild.members.fetch(message.author.id);
  //Ignoring staff
  if (!isStaff(message, guildMember)) {
    gifDetector(message);
  }
  //Not ignoring staff
  await checkForInlineURLs(client, content, message, getModChannels);
}

client.login(token);

process.on("unhandledRejection", async (err) => console.log(err.stack));
process.on("uncaughtException", async (err) => console.log(err.stack));
