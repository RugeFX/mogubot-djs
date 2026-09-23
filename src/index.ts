import "dotenv/config";

import { generateDependencyReport } from "@discordjs/voice";
import { join } from "node:path";

import Client from "./config/client";
import configureDB from "./database/configure";
import { closeDB } from "./database/client";

async function start(): Promise<void> {
	await configureDB();

	const commandsPath = join(__dirname, "commands");
	const client = new Client(process.env.TOKEN!, commandsPath);

	try {
		await client.login();
	}
	catch (error) {
		await closeDB();
		throw error;
	}

	console.log(generateDependencyReport());
}

void start().catch((error: unknown) => {
	console.error("MoguBot startup failed:", error);
	process.exitCode = 1;
});
