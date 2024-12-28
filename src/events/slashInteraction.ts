import { Colors, EmbedBuilder, Events } from "discord.js";
import { eventHandler } from "~/utils/eventHandler";

export default eventHandler(Events.InteractionCreate, (interaction) => {
	if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

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
});
