import type { ClientEvents } from "discord.js";
import type { Event } from "~/types/Event";

export function eventHandler<E extends keyof ClientEvents | string = string>(on: E, handler: (...args: E extends keyof ClientEvents ? ClientEvents[E] : unknown[]) => void): Event<E> {
	return {
		on,
		handler,
	};
}

export function eventHandlerOnce<E extends keyof ClientEvents | string = string>(on: E, handler: (...args: E extends keyof ClientEvents ? ClientEvents[E] : unknown[]) => void): Event<E> {
	return {
		on,
		once: true,
		handler,
	};
}