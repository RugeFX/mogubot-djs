import type { AudioPlayer, VoiceConnection } from "@discordjs/voice";

export interface Music {
	source: string;
	metadata: { title: string } & Record<string, string>
}

export interface MusicQueue {
	audioPlayer: AudioPlayer;
	voiceConnection: VoiceConnection;
	audios: Music[];
}