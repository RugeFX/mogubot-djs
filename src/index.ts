import "dotenv/config";
import { join } from "node:path";

import configureDB from "./database/configure";
import { generateDependencyReport } from "@discordjs/voice";
import Client from "./config/Client";

/** Configures and sets up the database */
configureDB();

/** Creates the client and sets up the listeners & commands */
const commandsPath = join(__dirname, "commands");
const client = new Client(process.env.TOKEN!, commandsPath);
client.login();

/** Debug */
console.log(generateDependencyReport());
