import { SlashCommandBuilder } from "discord.js";
import { requireVoiceConnection } from "~/guards/voice-channel";
import { skipPlayback } from "~/services/player";
import Command from "~/types/command";

export default {
	data: new SlashCommandBuilder()
		.setName("skip")
		.setDescription("Skips the currently playing music."),
	async execute(interaction) {
		const ctx = await requireVoiceConnection(interaction);
		if (!ctx) return;

		const { queues } = interaction.client;
		const currentTrack = queues.currentTrack(interaction.guildId);

		if (!currentTrack) {
			await interaction.reply({ content: "There is no music in the queue." });
			return;
		}

		if (!skipPlayback(queues, interaction.guildId, ctx.voiceConnection)) {
			await interaction.reply({ content: "There is no music playing." });
			return;
		}

		await interaction.reply({
			content: `**Skipped \`${currentTrack.metadata.title}\`**`,
		});
	},
} as Command;
