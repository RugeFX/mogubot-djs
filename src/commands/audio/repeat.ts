import { SlashCommandBuilder } from "discord.js";
import { requireVoiceConnection } from "~/guards/voice-channel";
import type { RepeatMode } from "~/types/music";
import type Command from "~/types/command";

export default {
	data: new SlashCommandBuilder()
		.setName("repeat")
		.setDescription("Repeats the music queue")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("current")
				.setDescription("Repeats the currently playing music"),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("all")
				.setDescription("Repeats all of the musics in the queue"),
		),
	async execute(interaction) {
		const ctx = await requireVoiceConnection(interaction);
		if (!ctx) return;

		const { queues } = interaction.client;
		const mode = interaction.options.getSubcommand() as RepeatMode;
		const currentTrack = queues.currentTrack(interaction.guildId);

		if (!currentTrack) {
			await interaction.reply({
				content: "There is no music in the queue.",
				ephemeral: true,
			});
			return;
		}

		queues.setRepeatMode(interaction.guildId, mode);

		if (mode === "current") {
			await interaction.reply({
				content: `**Repeating \`${currentTrack.metadata.title}\`**`,
			});
			return;
		}

		await interaction.reply({
			content: "**Repeating all musics in the queue.**",
		});
	},
} as Command;