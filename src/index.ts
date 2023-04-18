import fs from "fs";
import path from "path";
import { config } from "dotenv";
import {
  REST,
  Client,
  Collection,
  Routes,
  ActivityType,
  GatewayIntentBits,
  PresenceUpdateStatus,
  Colors,
} from "discord.js";
import Command from "./types/Command";
import { EmbedBuilder } from "@discordjs/builders";
import connection from "./mongoose/connection";

config();
const TOKEN = process.env.TOKEN as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const GUILD_ID = process.env.GUILD_ID as string;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessages,
  ],
});
const rest = new REST({ version: "10" }).setToken(TOKEN);

const commandsCollection = new Collection<string, Command>();
const commandsPath = path.join(__dirname, "commands");
readCommands(commandsPath);

function readCommands(directory: string) {
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      readCommands(filePath);
    } else if (file.endsWith(".ts")) {
      const command: Command = require(filePath).default;
      commandsCollection.set(command.data.name, command);
      console.log(`done ${filePath}`);
    } else {
      return;
    }
  });
}

client.on("ready", async () => {
  client.user?.setPresence({
    activities: [{ name: "onigirya", type: ActivityType.Listening }],
    status: PresenceUpdateStatus.Idle,
  });
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commandsCollection.map((c) => c.data.toJSON()),
    });
    console.log("Commands successfully updated!");
    console.log("Registered commands : ");
    commandsCollection.forEach((com) => console.log(com.data.name));
  } catch (e) {
    console.error(e);
  }

  console.log(`Mogu mogu! Client: ${client.user?.tag}`);
});

connection();

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    console.log("masuk button");
    try {
      const updateInteraction = await interaction.update({
        content: "A component interaction was received",
        components: [],
      });
      console.log(updateInteraction);
    } catch (e) {
      console.error(e);
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commandsCollection.get(interaction.commandName);
  if (!command) return;

  const errorEmbed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle("Error!")
    .setDescription("There was an error upon processing your command!")
    .setTimestamp();

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({
      embeds: [errorEmbed],
    });
  }
});

client.login(TOKEN);
