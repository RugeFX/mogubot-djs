import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
	data: new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
	async execute(interaction: ChatInputCommandInteraction) {
		const first = performance.now();

		await interaction.user.fetch();

		const second = performance.now();

		await interaction.reply(`Pong! ${(second - first).toFixed(2)}ms`);
	},
};
