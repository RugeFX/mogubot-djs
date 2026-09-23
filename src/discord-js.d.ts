import type { Collection } from "discord.js";
import type Command from "./types/command";
import type { GuildQueueManager } from "./services/queue";

declare module "discord.js" {
	interface Client {
		commands: Collection<string, Command>;
		queues: GuildQueueManager;
	}
}