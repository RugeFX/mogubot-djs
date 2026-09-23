import { Events } from "discord.js";
import { eventHandler } from "~/utils/event-handler";

export default eventHandler(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isAutocomplete() || !interaction.inCachedGuild()) return;

	const command = interaction.client.commands.get(interaction.commandName);
	if (!command || !command.autoComplete) return;

	try {
		await command.autoComplete(interaction);
	}
	catch (err) {
		console.error(err);
		if (!interaction.responded) await interaction.respond([]).catch(console.error);
	}
});
