import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	DiscordGatewayAdapterCreator,
	entersState,
	getVoiceConnection,
	joinVoiceChannel,
	NoSubscriberBehavior,
	VoiceConnection,
	VoiceConnectionStatus,
} from "@discordjs/voice";
import type { TextBasedChannel, VoiceBasedChannel } from "discord.js";
import { join } from "path";
import { Readable } from "stream";

import { ASSETS_AUDIO_DIR, LOCAL_MUSIC_LIST } from "~/constants";
import { GuildQueueManager } from "~/services/queue";
import { getAudioStream } from "~/services/youtube";
import type { MusicQueue } from "~/types/music";

/** Idle disconnect delay in ms (30 seconds). */
const IDLE_TIMEOUT_MS = 30_000;
const idleTimers = new WeakMap<MusicQueue, ReturnType<typeof setTimeout>>();

/**
 * Joins (or reuses) a voice connection for the given channel.
 * Waits until the connection is ready, or destroys it on timeout.
 */
export async function connectToChannel(
	channel: VoiceBasedChannel,
	textChannel: TextBasedChannel | null,
	queues: GuildQueueManager,
): Promise<VoiceConnection> {
	let connection = getVoiceConnection(channel.guild.id);
	if (connection && connection.joinConfig.channelId !== channel.id) {
		throw new Error("The bot is already connected to another voice channel.");
	}

	if (!connection) {
		connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
			debug: true,
		});

		connection.on(VoiceConnectionStatus.Destroyed, () => {
			queues.delete(channel.guild.id);
			if (textChannel && textChannel.isSendable()) {
				void textChannel.send({ content: `**Left voice channel \`${channel.name}\`**` }).catch(console.error);
			}
		});
	}

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, IDLE_TIMEOUT_MS);
		return connection;
	}
	catch (error) {
		connection.destroy();
		throw error;
	}
}

/** Reserves a track synchronously, then prepares its audio stream. */
export async function startPlayback(queues: GuildQueueManager, guildId: string, connection: VoiceConnection): Promise<boolean> {
	const reservation = queues.reserve(guildId);
	if (!reservation) return false;

	const timer = idleTimers.get(reservation.queue);
	if (timer) clearTimeout(timer);
	idleTimers.delete(reservation.queue);

	const { queue, track, playbackId } = reservation;
	try {
		const resource = track.type === "local"
			? createAudioResource(join(ASSETS_AUDIO_DIR, LOCAL_MUSIC_LIST[track.metadata.title]), { metadata: track.metadata })
			: createAudioResource(Readable.fromWeb(await getAudioStream(track.source)), { metadata: track.metadata });

		if (!queues.isCurrent(queue, playbackId) || connection.state.status === VoiceConnectionStatus.Destroyed) {
			resource.playStream.destroy();
			if (connection.state.status === VoiceConnectionStatus.Destroyed && queues.get(guildId) === queue) queues.delete(guildId);
			return false;
		}

		const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Stop } });
		if (!queues.setPlayer(queue, playbackId, player)) {
			resource.playStream.destroy();
			return false;
		}

		player.on(AudioPlayerStatus.Idle, () => {
			if (queues.finish(queue, playbackId, true)) scheduleNext(queues, queue, connection);
		});
		player.on("error", (error) => {
			console.error("Audio playback failed:", error);
			if (queues.finish(queue, playbackId, false)) {
				player.stop(true);
				scheduleNext(queues, queue, connection);
			}
		});

		connection.subscribe(player);
		player.play(resource);
		return true;
	}
	catch (error) {
		console.error("Could not start audio:", error);
		if (queues.finish(queue, playbackId, false)) scheduleNext(queues, queue, connection);
		return false;
	}
}

/** Skips the current track, including one whose stream is still loading. */
export function skipPlayback(queues: GuildQueueManager, guildId: string, connection: VoiceConnection): boolean {
	const queue = queues.get(guildId);
	const player = queue?.audioPlayer;
	if (!queue || !queues.finish(queue, queue.playbackId, false)) return false;

	player?.stop(true);
	scheduleNext(queues, queue, connection);
	return true;
}

function scheduleNext(queues: GuildQueueManager, queue: MusicQueue, connection: VoiceConnection): void {
	if (queues.get(queue.guildId) !== queue || connection.state.status === VoiceConnectionStatus.Destroyed) return;

	if (queue.audios.length) {
		void startPlayback(queues, queue.guildId, connection);
		return;
	}

	const oldTimer = idleTimers.get(queue);
	if (oldTimer) clearTimeout(oldTimer);
	const timer = setTimeout(() => {
		idleTimers.delete(queue);
		if (queues.get(queue.guildId) === queue && !queue.audios.length && !queue.currentlyPlaying && connection.state.status !== VoiceConnectionStatus.Destroyed) {
			queues.delete(queue.guildId);
			connection.destroy();
		}
	}, IDLE_TIMEOUT_MS);
	idleTimers.set(queue, timer);
}
