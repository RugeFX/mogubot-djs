import { AutocompleteInteraction, Events } from "discord.js";
import type { Event } from "~/types/Event";
import type { WithClient } from "~/types/Command";

export default {
	on: Events.InteractionCreate,
	type: "on",
	handler: (interaction: WithClient<AutocompleteInteraction<"cached">>) => {
		if (!interaction.isAutocomplete()) return;

		const command = interaction.client.commands.get(interaction.commandName);
		if (!command || !command.autoComplete) return;

		try {
			command.autoComplete(interaction);
		}
		catch (err) {
			console.error(err);
		}
	},
} as Event;