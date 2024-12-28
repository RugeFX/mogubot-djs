import { ActivityType, Events, PresenceUpdateStatus, REST, Routes } from "discord.js";
import { eventHandler } from "~/utils/eventHandler";

export default eventHandler(
	Events.ClientReady,
	async (client) => {
		const rest = new REST({ version: "10" }).setToken(client.token);

		client.user?.setPresence({
			activities: [{ name: "onigirya", type: ActivityType.Listening }],
			status: PresenceUpdateStatus.Idle,
		});

		try {
			await rest.put(Routes.applicationCommands(client.user!.id), {
				body: client.commands.map((cmd) => cmd.data.toJSON()),
			});
			console.log("Commands successfully updated!");
			console.log("Registered commands : ");
			client.commands.forEach((_, name) => console.log(`- ${name}`));
		}
		catch (e) {
			console.error(e);
		}

		console.log(`Mogu mogu! Client: ${client.user?.tag}`);
	},
);