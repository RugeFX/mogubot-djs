import "dotenv/config";
import { join } from "node:path";
import {
  REST,
  Client,
  Collection,
  Routes,
  ActivityType,
  GatewayIntentBits,
  PresenceUpdateStatus,
  Colors,
  EmbedBuilder,
} from "discord.js";
import configureDB from "./database/configure";
import readCommands from "./utils/readCommands";
import type Command from "./types/Command";

const TOKEN = process.env.TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID!;

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
const commandsPath = join(__dirname, "commands");

configureDB();
readCommands(commandsCollection, commandsPath);

client.on("ready", async (c) => {
  c.user.setPresence({
    activities: [{ name: "onigirya", type: ActivityType.Listening }],
    status: PresenceUpdateStatus.Idle,
  });

  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commandsCollection.map((c) => c.data.toJSON()),
    });
    console.log("Commands successfully updated!");
    console.log("Registered commands : ");
    commandsCollection.forEach((_, name) => console.log(`- ${name}`));
  } catch (e) {
    console.error(e);
  }

  console.log(`Mogu mogu! Client: ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    const command = commandsCollection.get(interaction.customId);
    console.log("masuk button");
  } else if (interaction.isChatInputCommand()) {
    const command = commandsCollection.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle("Error!")
            .setDescription("There was an error upon processing your command!")
            .setTimestamp(),
        ],
      });
    }
  }
});

client.login(TOKEN);
