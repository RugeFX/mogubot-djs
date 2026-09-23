import "dotenv/config";
import { join } from "node:path";
import { generateDependencyReport } from "@discordjs/voice";

import configureDB from "./database/configure";
import Client from "./config/client";

/** Configures and sets up the database */
configureDB();

/** Creates the client and sets up the listeners & commands */
const commandsPath = join(__dirname, "commands");
const client = new Client(process.env.TOKEN!, commandsPath);
void client.login().catch(console.error);

/** Debug */
console.log(generateDependencyReport());
