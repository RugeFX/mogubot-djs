import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	joinVoiceChannel,
	VoiceConnection,
	VoiceConnectionStatus,
} from "@discordjs/voice";
import { SlashCommandBuilder, VoiceBasedChannel } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import Client from "~/config/Client";
import Command from "~/types/Command";
import { Music, MusicQueue } from "~/types/Music";

const MUSIC_LIST = readdirSync(join(__dirname, "../../../assets/audio"))
	.filter((file) => file.endsWith(".mp3"))
	.reduce((acc, file) => {
		acc[file.split(".")[0]] = file;
		return acc;
	}, {} as Record<string, string>);

export default {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("Plays a song (TUYU songs only for now)")
		.addStringOption((option) =>
			option
				.setName("song")
				.setDescription("Select a song.")
				.setRequired(true)
				.addChoices(Object.keys(MUSIC_LIST).map((name) => ({ name, value: name }))),
		),
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

		const selectedSong = interaction.options.getString("song");
		// This should never happen
		if (!selectedSong) return;

		const music: Music = {
			metadata: { title: selectedSong, by: "TUYU" },
			source: join(__dirname, `../../../assets/audio/${MUSIC_LIST[selectedSong]}`),
		};

		const voiceConnection = await connectToChannel(voiceChannel);

		const queue = addMusicToQueue(music, client.musicQueues, interaction.guildId);

		if (!queue.currentlyPlaying) {
			playAudio(music, queue, voiceConnection);

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

function playAudio(music: Music, queue: MusicQueue, voiceConnection: VoiceConnection) {
	const audioPlayer = createAudioPlayer();

	const resource = createAudioResource(music.source, { metadata: music.metadata });

	audioPlayer.play(resource);

	voiceConnection.subscribe(audioPlayer);

	queue.audioPlayer = audioPlayer;
	queue.currentlyPlaying = true;

	audioPlayer.on(AudioPlayerStatus.Idle, () => {
		console.log("IM IDLE");

		queue.currentlyPlaying = false;
		playNext(queue, voiceConnection);
	});
}

function playNext(queue: MusicQueue, voiceConnection: VoiceConnection) {
	queue.audios.shift();

	if (!queue.audios.length) {
		setTimeout(() => {
			if (!queue.audios.length && !queue.currentlyPlaying && voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
				voiceConnection.destroy();
			}
		}, 30_000);
		return;
	}

	const nextMusic = queue.audios[0];
	playAudio(nextMusic, queue, voiceConnection);
}

function addMusicToQueue(music: Music, musicQueues: Client["musicQueues"], guildId: string) {
	const queueExists = musicQueues.has(guildId);

	if (!queueExists) {
		const queue: MusicQueue = {
			currentlyPlaying: false,
			audios: [music],
		};
		musicQueues.set(guildId, queue);

		return queue;
	}

	const queue = musicQueues.get(guildId)!;
	queue.audios.push(music);

	return queue;
}
