import { Events } from "discord.js";
import { eventHandler } from "~/utils/eventHandler";

export default eventHandler(Events.InteractionCreate, (interaction) => {
	if (!interaction.isAutocomplete() || !interaction.inCachedGuild()) return;

	const command = interaction.client.commands.get(interaction.commandName);
	if (!command || !command.autoComplete) return;

	try {
		command.autoComplete(interaction);
	}
	catch (err) {
		console.error(err);
	}
});