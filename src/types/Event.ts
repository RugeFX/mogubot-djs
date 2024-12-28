import { type ClientEvents } from "discord.js";

export interface Event<E extends keyof ClientEvents | string = string> {
	on: E;
	once?: boolean;
	handler: (...args: E extends keyof ClientEvents ? ClientEvents[E] : unknown[]) => void;
}