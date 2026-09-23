import { Collection, Client as DJSClient, GatewayIntentBits } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";
import fs from "fs/promises";
import path from "path";

import type Command from "~/types/command";
import type { Event } from "~/types/event";
import { GuildQueueManager } from "~/services/queue";

export default class Client extends DJSClient {
	public commands: Collection<string, Command>;
	public queues: GuildQueueManager;
	private readonly loginToken: string;

	public constructor(token: string, public commandsPath: string) {
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

		this.loginToken = token;
		this.commands = new Collection();
		this.queues = new GuildQueueManager();
	}

	public override async login() {
		await this.init();
		return super.login(this.loginToken);
	}

	private async init() {
		await this.readCommands();
		await this.setupEventHandlers();
	}

	private async readCommands() {
		const files = await fs.readdir(this.commandsPath, { recursive: true });

		const commands = await Promise.all<Command>(
			files
				.filter(file => file.endsWith(".ts") || file.endsWith(".js"))
				.map(async (file) => (await import(path.join(this.commandsPath, file))).default),
		);

		commands.forEach((command) => {
			this.commands.set(command.data.name, command);
			console.log(`Done loading command : ${command.data.name}`);
		});
	}

	private async setupEventHandlers() {
		const handlers = (await readdir(join(__dirname, "../events")))
			.filter(file => file.endsWith(".ts") || file.endsWith(".js"));

		const events = await Promise.all<Event>(
			handlers.map(async (handler) => (await import(join(__dirname, "../events", handler))).default),
		);

		events.forEach(({ on, once, handler }, index) => {
			this[once ? "once" : "on"](on, handler);
			console.log(`Event from file ${handlers[index]}, ${once ? "once" : "on"} ${on} has been registered!`);
		});
	}
}
