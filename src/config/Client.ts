import { Collection, Client as DJSClient, GatewayIntentBits } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";
import fs from "fs/promises";
import path from "path";

import type Command from "~/types/Command";
import type { MusicQueue } from "~/types/Music";
import type { Event } from "~/types/Event";

export default class Client extends DJSClient {
	public declare token: string;
	public commands: Collection<string, Command>;
	public musicQueues: Collection<string, MusicQueue>;

	constructor(token: string, commandsPath: string) {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.DirectMessageTyping,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.GuildVoiceStates,
			],
		});

		this.commands = new Collection();
		this.musicQueues = new Collection();
		this.token = token;

		this.readCommands(this.commands, commandsPath);
		this.setupEventHandlers();
	}

	public override login() {
		return super.login(this.token);
	}

	private async readCommands(collection: Collection<string, Command>, directory: string) {
		const files = await fs.readdir(directory, { recursive: true });

		for (const file of files) {
			const filePath = path.join(directory, file);

			if (file.endsWith(".ts") || file.endsWith(".js")) {
				const { default: command }: { default: Command } = await import(filePath);
				collection.set(command.data.name, command);
				console.log(`Done loading command : ${command.data.name}`);
			}
		}
	}

	private async setupEventHandlers() {
		const events = await readdir(join(__dirname, "../events"));

		for (const event of events) {
			const eventPath = join(__dirname, "../events", event);
			const eventFile: Event = (await import(eventPath)).default;

			if (eventFile.once === true) {
				this.once(eventFile.on, eventFile.handler);
			}
			else {
				this.on(eventFile.on, eventFile.handler);
			}

			console.log(`Event from file ${event} is registered!`);
		}
	}
}
