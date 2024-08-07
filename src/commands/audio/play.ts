import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	joinVoiceChannel,
	VoiceConnection,
	VoiceConnectionStatus,
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import ytsr from "@distube/ytsr";
import { SlashCommandBuilder, VoiceBasedChannel } from "discord.js";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import type Client from "~/config/Client";
import type Command from "~/types/Command";
import type { Music, MusicQueue } from "~/types/Music";

const MUSIC_LIST = readdirSync(join(__dirname, "../../../assets/audio"))
	.filter((file) => file.endsWith(".mp3"))
	.reduce((acc, file) => {
		acc[file.split(".")[0]] = file;
		return acc;
	}, {} as Record<string, string>);

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
						.addChoices(Object.keys(MUSIC_LIST).map((name) => ({ name, value: name }))),
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

		const query = interaction.options.getFocused().toLowerCase();

		const result = await ytsr(query || "lofi", { limit: 10, type: "video", safeSearch: true });

		try {
			await interaction.respond(result.items.map((video) => ({ name: video.name, value: video.url })));
		}
		catch (error) {
			console.error(error);
		}
	},
	async execute(interaction) {
		const voiceChannel = interaction.member.voice.channel;
		const { client } = interaction;

		if (!voiceChannel) {
			await interaction.reply({
				content: "You must be in a voice channel to use this command!",
				ephemeral: true,
			});
			return;
		}

		const type = interaction.options.getSubcommand() as "local" | "youtube";
		const selectedMusic = interaction.options.getString("music", true);

		if (!validateSource(selectedMusic, type)) {
			await interaction.reply({
				content: "Could not find the source!",
				ephemeral: true,
			});
			return;
		}

		const music: Music = type === "local"
			? {
				metadata: { title: selectedMusic },
				source: join(__dirname, `../../../assets/audio/${MUSIC_LIST[selectedMusic]}`),
				type,
			}
			: {
				metadata: { title: (await getYoutubeDetails(selectedMusic)).title },
				source: selectedMusic,
				type,
			};

		const voiceConnection = await connectToChannel(voiceChannel);

		const queue = addMusicToQueue(music, client.musicQueues, interaction.guildId);

		if (!queue.currentlyPlaying) {
			playAudio(music, client.musicQueues, queue, voiceConnection);

			await interaction.reply({
				content: `**Now Playing \`${music.metadata.title}\`**`,
			});
			return;
		}

		await interaction.reply({
			content: `**Queued \`${music.metadata.title}\`**`,
		});
	},
} as Command;

async function connectToChannel(channel: VoiceBasedChannel) {
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
		return connection;
	}
	catch (error) {
		connection.destroy();
		throw error;
	}
}

async function getYoutubeDetails(url: string) {
	const info = await ytdl.getBasicInfo(url);
	return info.videoDetails;
}

function playAudio(music: Music, musicQueues: Client["musicQueues"], queue: MusicQueue, voiceConnection: VoiceConnection) {
	const audioPlayer = createAudioPlayer();

	const resource = createAudioResource(
		music.type === "local"
			? join(__dirname, `../../../assets/audio/${MUSIC_LIST[music.metadata.title]}`)
			: ytdl(music.source, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25 }),
		{ metadata: music.metadata },
	);

	audioPlayer.play(resource);

	voiceConnection.subscribe(audioPlayer);

	queue.audioPlayer = audioPlayer;
	queue.currentlyPlaying = true;

	audioPlayer.on(AudioPlayerStatus.Idle, () => {
		console.log("IM IDLE");

		queue.currentlyPlaying = false;
		playNext(musicQueues, queue, voiceConnection);
	});
}

function playNext(musicQueues: Client["musicQueues"], queue: MusicQueue, voiceConnection: VoiceConnection) {
	queue.audios.shift();

	if (!queue.audios.length) {
		setTimeout(() => {
			if (!queue.audios.length && !queue.currentlyPlaying && voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
				voiceConnection.destroy();
				musicQueues.delete(queue.guildId);
			}
		}, 30_000);
		return;
	}

	const nextMusic = queue.audios[0];
	playAudio(nextMusic, musicQueues, queue, voiceConnection);
}

function addMusicToQueue(music: Music, musicQueues: Client["musicQueues"], guildId: string) {
	const queueExists = musicQueues.has(guildId);

	if (!queueExists) {
		const queue: MusicQueue = {
			currentlyPlaying: false,
			audios: [music],
			guildId,
		};
		musicQueues.set(guildId, queue);

		return queue;
	}

	const queue = musicQueues.get(guildId)!;
	queue.audios.push(music);

	return queue;
}

function validateSource(source: string, type: "local" | "youtube") {
	return type === "local"
		? existsSync(join(__dirname, `../../../assets/audio/${MUSIC_LIST[source]}`))
		: ytdl.validateURL(source);
}