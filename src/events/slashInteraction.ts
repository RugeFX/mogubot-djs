import { ChatInputCommandInteraction, Colors, EmbedBuilder, Events } from "discord.js";
import type { Event } from "~/types/Event";
import type Client from "~/config/Client";

export default {
	on: Events.InteractionCreate,
	type: "on",
	handler: (interaction: ChatInputCommandInteraction<"cached"> & { client: Client }) => {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) return;
			try {
				command.execute(
					interaction as ChatInputCommandInteraction<"cached"> & { client: Client },
				);
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
		}
	},
} as Event;