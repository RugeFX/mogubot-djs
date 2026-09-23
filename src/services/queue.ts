import type { AudioPlayer } from "@discordjs/voice";
import type { Music, MusicQueue, RepeatMode } from "~/types/music";

/**
 * Manages per-guild music queues. Encapsulates all queue state mutations
 * so commands don't need to reach into raw collections.
 */
export class GuildQueueManager {
	private readonly queues = new Map<string, MusicQueue>();

	/** Returns the queue for a guild, or undefined if none exists. */
	get(guildId: string): MusicQueue | undefined {
		return this.queues.get(guildId);
	}

	/** Returns true if a queue exists for the guild. */
	has(guildId: string): boolean {
		return this.queues.has(guildId);
	}

	/**
	 * Adds a track to the guild's queue. Creates the queue if it doesn't exist.
	 * Returns the queue containing the track.
	 */
	add(guildId: string, music: Music): MusicQueue {
		const existing = this.queues.get(guildId);

		if (existing) {
			existing.audios.push(music);
			return existing;
		}

		const queue: MusicQueue = {
			currentlyPlaying: false,
			audios: [music],
			guildId,
			repeatMode: "off",
			playbackId: 0,
		};
		this.queues.set(guildId, queue);
		return queue;
	}

	/** Removes and returns the track at the given index, or null if invalid. */
	removeAt(guildId: string, index: number): Music | null {
		const queue = this.queues.get(guildId);
		if (!queue || !Number.isInteger(index) || index < 0 || index >= queue.audios.length) return null;

		return queue.audios.splice(index, 1)[0];
	}

	/** Returns the currently playing track (index 0), or null if the queue is empty. */
	currentTrack(guildId: string): Music | null {
		const queue = this.queues.get(guildId);
		if (!queue || !queue.audios.length) return null;
		return queue.audios[0];
	}

	/** Reserves the current track before any asynchronous stream setup begins. */
	reserve(guildId: string): { queue: MusicQueue; track: Music; playbackId: number } | null {
		const queue = this.queues.get(guildId);
		if (!queue || queue.currentlyPlaying || !queue.audios.length) return null;

		queue.currentlyPlaying = true;
		queue.playbackId += 1;
		return { queue, track: queue.audios[0], playbackId: queue.playbackId };
	}

	isCurrent(queue: MusicQueue, playbackId: number): boolean {
		return this.queues.get(queue.guildId) === queue && queue.currentlyPlaying && queue.playbackId === playbackId;
	}

	setPlayer(queue: MusicQueue, playbackId: number, player: AudioPlayer): boolean {
		if (!this.isCurrent(queue, playbackId)) return false;
		queue.audioPlayer = player;
		return true;
	}

	/** Sets the repeat mode for the guild's queue. */
	setRepeatMode(guildId: string, mode: RepeatMode): void {
		const queue = this.queues.get(guildId);
		if (queue) queue.repeatMode = mode;
	}

	/**
	 * Finishes the reserved track. Natural endings honor repeat mode; skips and
	 * failures remove the track. Stale callbacks cannot change a newer track.
	 */
	finish(queue: MusicQueue, playbackId: number, repeat: boolean): boolean {
		if (!this.isCurrent(queue, playbackId)) return false;

		const lastMusic = queue.audios.shift();
		queue.currentlyPlaying = false;
		queue.audioPlayer = undefined;

		if (repeat && lastMusic) {
			if (queue.repeatMode === "all") queue.audios.push(lastMusic);
			if (queue.repeatMode === "current") queue.audios.unshift(lastMusic);
		}

		return true;
	}

	/** Destroys the queue for a guild, removing all state. */
	delete(guildId: string): void {
		this.queues.delete(guildId);
	}

	/** Returns all tracks in the queue as a readonly array. */
	tracks(guildId: string): readonly Music[] {
		return this.queues.get(guildId)?.audios ?? [];
	}
}
