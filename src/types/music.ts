import type { AudioPlayer } from "@discordjs/voice";

export interface MusicMetadata {
	title: string;
	[key: string]: string;
}

export interface Music {
	source: string;
	metadata: MusicMetadata;
	type: "local" | "youtube"
}

export type RepeatMode = "off" | "all" | "current";

export interface MusicQueue {
	currentlyPlaying: boolean;
	audioPlayer?: AudioPlayer;
	audios: Music[];
	guildId: string;
	repeatMode: RepeatMode;
	playbackId: number;
}
