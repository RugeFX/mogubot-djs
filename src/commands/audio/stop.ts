import { SlashCommandBuilder } from "discord.js";
import { requireVoiceConnection } from "~/guards/voice-channel";
import Command from "~/types/command";

export default {
	data: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stops the bot from playing music."),
	async execute(interaction) {
		const ctx = await requireVoiceConnection(interaction);
		if (!ctx) return;

		interaction.client.queues.delete(interaction.guildId);
		ctx.voiceConnection.destroy();

		await interaction.reply({
			content: `**Stopped playing music in channel \`${ctx.voiceChannel.name}\`**`,
			ephemeral: true,
		});
	},
} as Command;
