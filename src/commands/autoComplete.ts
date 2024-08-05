import { SlashCommandBuilder } from "discord.js";
import type Command from "~/types/Command";

export default {
	data: new SlashCommandBuilder()
		.setName("autocomplete")
		.setDescription("Autocomplete testing")
		.addStringOption((option) =>
			option
				.setName("command")
				.setDescription("Search for a command!")
				.setRequired(true)
				.setAutocomplete(true),
		),
	async autoComplete(interaction) {
		const query = interaction.options.getFocused().toLowerCase();

		const commands = interaction.client.commands.map((cmd) => cmd.data.name).filter((cmd) => cmd.toLowerCase().includes(query));

		try {
			await interaction.respond(commands.map((cmd) => ({ name: cmd, value: cmd })));
		}
		catch (error) {
			console.error(error);
		}
	},
	async execute(interaction) {
		const query = interaction.options.getString("command", true);

		const command = interaction.client.commands.get(query);

		if (!command) {
			await interaction.reply(`**${query}** is not a command.`);
			return;
		}

		await interaction.reply(`**${command.data.name}** is a command with ${command.data.options.length ? `the following options: ${command.data.options.map((option) => `\`${option.toJSON().name}\``).join(", ")}` : "no options"}`);
	},
} as Command;