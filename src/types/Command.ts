import type { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type Client from "~/config/Client";

export type WithClient<T> = T & { client: Client };

interface Command {
	data: SlashCommandBuilder;
	execute: (
		interaction: ChatInputCommandInteraction<"cached">
	) => Promise<void>;
	autoComplete?: (
		interaction: AutocompleteInteraction<"cached">
	) => Promise<void>;
};

export default Command;
