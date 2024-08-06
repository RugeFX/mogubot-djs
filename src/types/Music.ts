import type { AudioPlayer } from "@discordjs/voice";

export interface Music {
	source: string;
	metadata: { title: string } & Record<string, string>;
	type: "local" | "youtube"
}

export interface MusicQueue {
	currentlyPlaying: boolean;
	audioPlayer?: AudioPlayer;
	audios: Music[];
	guildId: string;
}