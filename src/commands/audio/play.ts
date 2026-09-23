import { SlashCommandBuilder } from "discord.js";
import { existsSync } from "fs";
import { join } from "path";

import { ASSETS_AUDIO_DIR, LOCAL_MUSIC_LIST } from "~/constants";
import { requireUserInVoice } from "~/guards/voice-channel";
import { connectToChannel, startPlayback } from "~/services/player";
import { getVideoInfo, isValidYoutubeUrl, searchVideos } from "~/services/youtube";
import { respondAutocompleteWithinDeadline } from "~/utils/autocomplete";
import type Command from "~/types/command";
import type { Music } from "~/types/music";

export default {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("Plays music")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("local")
				.setDescription("Musics from the local audio folder")
				.addStringOption((option) =>
					option
						.setName("music")
						.setDescription("Select a music.")
						.setRequired(true)
						.addChoices(Object.keys(LOCAL_MUSIC_LIST).map((name) => ({ name, value: name }))),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("youtube")
				.setDescription("Musics from YouTube")
				.addStringOption((option) =>
					option
						.setName("music")
						.setDescription("Search for a music from YouTube.")
						.setRequired(true)
						.setAutocomplete(true),
				),
		),
	async autoComplete(interaction) {
		if (interaction.options.getSubcommand() === "local") return;

		const query = interaction.options.getFocused().trim().toLowerCase();
		await respondAutocompleteWithinDeadline(interaction, async () =>
			query ? (await searchVideos(query, 10)).map((v) => ({ name: v.title, value: v.url })) : [],
		);
	},
	async execute(interaction) {
		const voiceChannel = await requireUserInVoice(interaction);
		if (!voiceChannel) return;

		const { client } = interaction;
		const type = interaction.options.getSubcommand() as "local" | "youtube";
		const selectedMusic = interaction.options.getString("music", true);

		if (!validateSource(selectedMusic, type)) {
			await interaction.reply({
				content: "Could not find the source!",
				ephemeral: true,
			});
			return;
		}

		await interaction.deferReply();

		const music: Music =
			type === "local"
				? {
					metadata: { title: selectedMusic },
					source: join(ASSETS_AUDIO_DIR, LOCAL_MUSIC_LIST[selectedMusic]),
					type,
				}
				: {
					metadata: { title: (await getVideoInfo(selectedMusic)).title ?? selectedMusic },
					source: selectedMusic,
					type,
				};

		const voiceConnection = await connectToChannel(voiceChannel, interaction.channel, client.queues);

		const queue = client.queues.add(interaction.guildId, music);

		if (!queue.currentlyPlaying) {
			const started = await startPlayback(client.queues, interaction.guildId, voiceConnection);

			await interaction.editReply({
				content: started
					? `**Now Playing \`${music.metadata.title}\`**`
					: `**Could not play \`${music.metadata.title}\`**`,
			});
			return;
		}

		await interaction.editReply({
			content: `**Queued \`${music.metadata.title}\`**`,
		});
	},
} as Command;

function validateSource(source: string, type: "local" | "youtube") {
	return type === "local"
		? Boolean(LOCAL_MUSIC_LIST[source] && existsSync(join(ASSETS_AUDIO_DIR, LOCAL_MUSIC_LIST[source])))
		: isValidYoutubeUrl(source);
}
