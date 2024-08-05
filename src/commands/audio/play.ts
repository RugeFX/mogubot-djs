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

		await interaction.reply({
			content: `Playing / Queued ${music.metadata.title}`,
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