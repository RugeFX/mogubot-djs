import { getVoiceConnection } from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import Command from "~/types/Command";
import { Music } from "~/types/Music";

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
		const queue = interaction.client.musicQueues.get(interaction.guildId);
		const query = interaction.options.getString("music", true);

		if (!queue || !queue.audios.length) {
			await interaction.respond([{ name: "There is no music in the queue.", value: -1 }]);
			return;
		}

		const musics = queue.audios.map((music, i) => ({ name: `${i + 1} - ${music.metadata.title}`, value: `${i}` }));

		try {
			await interaction.respond(musics.filter((music) => music.name.toLowerCase().includes(query.toLowerCase())));
		}
		catch (error) {
			console.error(error);
		}
	},
	async execute(interaction) {
		const voiceChannel = interaction.member.voice.channel;
		const voiceConnection = getVoiceConnection(interaction.guildId);
		const { client } = interaction;

		if (!voiceChannel || !voiceConnection) {
			await interaction.reply({
				content: "You must be in a voice channel to use this command!",
				ephemeral: true,
			});
			return;
		}

		const selectedMusicIndex = Number(interaction.options.getString("music", true));
		const queue = client.musicQueues.get(interaction.guildId);

		if (!queue || !queue.audios.length || selectedMusicIndex === -1) {
			await interaction.reply({ content: "There is no music in the queue." });
			return;
		}
		if (Number.isNaN(selectedMusicIndex) || selectedMusicIndex >= queue.audios.length || selectedMusicIndex < 0) {
			await interaction.reply({ content: "Invalid music selected." });
			return;
		}

		let deletedMusic: Music;
		if (queue.currentlyPlaying && selectedMusicIndex === 0) {
			// Also skip the currently playing music
			deletedMusic = queue.audios[0];
			queue.audioPlayer?.stop();
		}
		else {
			deletedMusic = queue.audios.splice(selectedMusicIndex, 1)[0];
		}

		await interaction.reply({
			content: `**Removed \`${deletedMusic.metadata.title}\` from the queue.**`,
		});
	},
} as Command;
