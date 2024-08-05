import {
	Collection,
	Client as DJSClient,
	GatewayIntentBits,
} from "discord.js";
import readCommands from "~/utils/readCommands";
import type Command from "~/types/Command";
import type { MusicQueue } from "~/types/Music";
import { readdir } from "fs/promises";
import { join } from "path";
import { Event } from "~/types/Event";

export default class Client extends DJSClient {
	public declare token: string;
	commands: Collection<string, Command>;
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

		void readCommands(this.commands, commandsPath);
		void this.setupEventHandlers();
	}

	public login(): Promise<string> {
		return super.login(this.token);
	}

	private async setupEventHandlers() {
		const events = await readdir(join(__dirname, "../events"));

		for (const event of events) {
			const eventPath = join(__dirname, "../events", event);
			const eventFile = (await import(eventPath)).default as Event;

			switch (eventFile.type) {
			case "once":
				this.once(eventFile.on, eventFile.handler);
				break;
			case "on":
				this.on(eventFile.on, eventFile.handler);
				break;
			default:
				throw new Error(`Invalid event type on ${event}`);
			}

			console.log(`Event from file ${event} is registered!`);
		}
	}
}
