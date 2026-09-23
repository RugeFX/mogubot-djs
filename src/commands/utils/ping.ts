import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
	data: new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
	async execute(interaction: ChatInputCommandInteraction) {
		const start = performance.now();

		await interaction.deferReply();

		const apiPing = Math.round(performance.now() - start);
		const gatewayPing = Math.round(interaction.client.ws.ping);

		await interaction.editReply(
			[
				"🏓 Pong!",
				`API: ${apiPing}ms`,
				`Gateway: ${gatewayPing}ms`,
			].join("\n"),
		);
	},
};
