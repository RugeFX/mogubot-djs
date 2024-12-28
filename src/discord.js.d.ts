import type { Collection } from "discord.js";
import type Command from "./types/Command";
import type { MusicQueue } from "./types/Music";

declare module "discord.js" {
	interface Client {
		commands: Collection<string, Command>;
		musicQueues: Collection<string, MusicQueue>;
	}
}