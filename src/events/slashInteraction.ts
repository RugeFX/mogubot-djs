import { ChatInputCommandInteraction, Colors, EmbedBuilder, Events } from "discord.js";
import type { Event } from "~/types/Event";
import type { WithClient } from "~/types/Command";

export default {
	on: Events.InteractionCreate,
	type: "on",
	handler: (interaction: WithClient<ChatInputCommandInteraction<"cached">>) => {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return;

		try {
			command.execute(interaction);
		}
		catch (err) {
			console.error(err);
			interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Red)
						.setTitle("Error!")
						.setDescription("There was an error upon processing your command!")
						.setTimestamp(),
				],
			});
		}
	},
} as Event;