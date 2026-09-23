import { SlashCommandBuilder } from "discord.js";
import { requireVoiceConnection } from "~/guards/voice-channel";
import { skipPlayback } from "~/services/player";
import Command from "~/types/command";

export default {
	data: new SlashCommandBuilder()
		.setName("remove")
		.setDescription("Removes a music from the server's music queue.")
		.addStringOption((option) =>
			option
				.setName("music")
				.setDescription("Select a music to be removed from the queue.")
				.setRequired(true)
				.setAutocomplete(true),
		),
	async autoComplete(interaction) {
		const { queues } = interaction.client;
		const query = interaction.options.getString("music", true);
		const tracks = queues.tracks(interaction.guildId);

		if (!tracks.length) {
			await interaction.respond([{ name: "There is no music in the queue.", value: -1 }]);
			return;
		}

		const musics = tracks.map((music, i) => ({ name: `${i + 1} - ${music.metadata.title}`.slice(0, 100), value: `${i}` }));

		try {
			await interaction.respond(musics.filter((music) => music.name.toLowerCase().includes(query.toLowerCase())).slice(0, 25));
		}
		catch (error) {
			console.error(error);
			if (!interaction.responded) await interaction.respond([]).catch(console.error);
		}
	},
	async execute(interaction) {
		const ctx = await requireVoiceConnection(interaction);
		if (!ctx) return;

		const { queues } = interaction.client;
		const selectedMusicIndex = Number(interaction.options.getString("music", true));
		const queue = queues.get(interaction.guildId);

		if (!queue || !queue.audios.length || selectedMusicIndex === -1) {
			await interaction.reply({ content: "There is no music in the queue." });
			return;
		}
		if (!Number.isInteger(selectedMusicIndex) || selectedMusicIndex >= queue.audios.length || selectedMusicIndex < 0) {
			await interaction.reply({ content: "Invalid music selected." });
			return;
		}

		if (queue.currentlyPlaying && selectedMusicIndex === 0) {
			// Removing the currently playing track — stop the player to trigger playNext
			const currentTrack = queues.currentTrack(interaction.guildId);
			if (!skipPlayback(queues, interaction.guildId, ctx.voiceConnection)) {
				await interaction.reply({ content: "There is no music playing." });
				return;
			}

			await interaction.reply({
				content: `**Removed \`${currentTrack!.metadata.title}\` from the queue.**`,
			});
		}
		else {
			const deletedMusic = queues.removeAt(interaction.guildId, selectedMusicIndex);

			await interaction.reply({
				content: `**Removed \`${deletedMusic!.metadata.title}\` from the queue.**`,
			});
		}
	},
} as Command;
