import { getVoiceConnection } from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import type Command from "~/types/Command";

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

		const mode = interaction.options.getSubcommand();
		const queue = client.musicQueues.get(interaction.guildId);

		if (!queue || !queue.audios.length) {
			await interaction.reply({
				content: "There is no music in the queue.",
				ephemeral: true,
			});
			return;
		};

		if (mode === "current") {
			const music = queue.audios[0];
			queue.repeatMode = "current";

			await interaction.reply({
				content: `**Repeating \`${music.metadata.title}\`**`,
			});
			return;
		}

		queue.repeatMode = "all";

		await interaction.reply({
			content: "**Repeating all musics in the queue.**",
		});
	},
} as Command;