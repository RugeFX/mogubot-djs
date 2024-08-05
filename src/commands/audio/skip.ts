import { getVoiceConnection } from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import Command from "~/types/Command";

export default {
	data: new SlashCommandBuilder()
		.setName("skip")
		.setDescription("Skips the currently playing song."),
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

		const queue = client.musicQueues.get(interaction.guildId);

		if (!queue || !queue.audios.length) {
			await interaction.reply({ content: "There is no music in the queue." });
			return;
		}

		const skippedMusic = queue.audios![0];
		queue.audioPlayer?.stop();

		console.log(queue.audios);

		await interaction.reply({
			content: `**Skipped \`${skippedMusic.metadata.title}\`**`,
		});
	},
} as Command;
