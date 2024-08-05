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
import { join } from "path";
import Command from "~/types/Command";
import { Music, MusicQueue } from "~/types/Music";

const MUSIC_LIST: Record<string, string> = {
	"It's Raining Nevertheless": "ItsRainingNevertheless.mp3",
	"Kakumei Zensen": "KakumeiZensen.mp3",
	"Bing Chilling": "BingChilling.mp3",
};

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

		const queueExists = client.musicQueues.has(interaction.guildId);
		if (!queueExists) {
			const [audioPlayer] = playAudio(music, voiceConnection);

			const musicQueue: MusicQueue = {
				audioPlayer,
				voiceConnection,
				audios: [],
			};

			audioPlayer.on(AudioPlayerStatus.Idle, async () => {
				console.log("we're idle");

				const next = musicQueue.audios.shift();
				if (!next) {
					// TODO: idk if this is right
					try {
						await entersState(audioPlayer, AudioPlayerStatus.Playing, 10_000);

						const adasdas = musicQueue.audios.shift()!;
						const [, resource] = playAudio(adasdas, voiceConnection);
						musicQueue.audioPlayer.play(resource);
					}
					catch (error) {
						await interaction.reply({
							content: "Failed to play next song",
							ephemeral: true,
						});
						return;
					}
				}
			});

			client.musicQueues.set(interaction.guildId, musicQueue);

			await interaction.reply({
				content: `Joined voice channel ${voiceChannel.name} & Playing ${music.metadata.title}`,
			});

			return;
		}

		const musicQueue = client.musicQueues.get(interaction.guildId)!;

		if (musicQueue.audioPlayer.state.status === AudioPlayerStatus.Idle) {
			const [audioPlayer] = playAudio(music, voiceConnection);

			musicQueue.audioPlayer = audioPlayer;

			audioPlayer.on(AudioPlayerStatus.Idle, () => {
				console.log("we're idle");

				const next = musicQueue.audios.shift();
				if (!next) {
					setTimeout(() => {
						if (!musicQueue.audios.length) {
							voiceConnection.destroy();
							client.musicQueues.delete(interaction.guildId);
						}
					}, 30_000);
					return;
				}

				const [nextAudioPlayer] = playAudio(next, voiceConnection);
				musicQueue.audioPlayer = nextAudioPlayer;
			});
		}
		else {
			musicQueue.audios.push(music);
		}

		await interaction.reply({
			content: `Playing / Queued ${music.metadata.title}`,
		});
	},
} as Command;

function playAudio(music: Music, voiceConnection: VoiceConnection) {
	const audioPlayer = createAudioPlayer();
	const resource = createAudioResource(music.source, { metadata: music.metadata });

	voiceConnection.subscribe(audioPlayer);
	audioPlayer.play(resource);

	return [audioPlayer, resource] as const;
}

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