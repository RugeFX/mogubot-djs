import { Colors, EmbedBuilder, Events } from "discord.js";
import { eventHandler } from "~/utils/event-handler";

export default eventHandler(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	}
	catch (err) {
		console.error(err);
		const reply = {
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Red)
					.setTitle("Error!")
					.setDescription("There was an error upon processing your command!")
					.setTimestamp(),
			],
		};
		if (interaction.deferred && !interaction.replied) {
			await interaction.editReply(reply).catch(console.error);
		}
		else if (interaction.replied) {
			await interaction.followUp(reply).catch(console.error);
		}
		else {
			await interaction.reply(reply).catch(console.error);
		}
	}
});
