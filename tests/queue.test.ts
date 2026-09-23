import assert from "node:assert/strict";
import test from "node:test";

import { GuildQueueManager } from "../src/services/queue";
import type { Music } from "../src/types/music";

function track(title: string): Music {
	return { type: "local", source: `${title}.mp3`, metadata: { title } };
}

test("a pending track reserves the queue so another play is queued", () => {
	const queues = new GuildQueueManager();
	queues.add("guild", track("first"));
	const first = queues.reserve("guild");
	assert.ok(first);

	queues.add("guild", track("second"));
	assert.equal(queues.reserve("guild"), null);
	assert.deepEqual(queues.tracks("guild").map(item => item.metadata.title), ["first", "second"]);

	assert.equal(queues.finish(first.queue, first.playbackId, true), true);
	assert.equal(queues.reserve("guild")?.track.metadata.title, "second");
});

test("natural endings repeat; explicit skips remove the current track", () => {
	for (const mode of ["all", "current"] as const) {
		const queues = new GuildQueueManager();
		queues.add("guild", track("first"));
		queues.add("guild", track("second"));
		queues.setRepeatMode("guild", mode);

		const first = queues.reserve("guild");
		assert.ok(first);
		assert.equal(queues.finish(first.queue, first.playbackId, true), true);
		assert.deepEqual(
			queues.tracks("guild").map(item => item.metadata.title),
			mode === "all" ? ["second", "first"] : ["first", "second"],
		);

		const next = queues.reserve("guild");
		assert.ok(next);
		assert.equal(queues.finish(next.queue, next.playbackId, false), true);
		assert.deepEqual(
			queues.tracks("guild").map(item => item.metadata.title),
			mode === "all" ? ["first"] : ["second"],
		);
	}
});

test("stale completion cannot advance a newer track or a replacement queue", () => {
	const queues = new GuildQueueManager();
	queues.add("guild", track("first"));
	queues.add("guild", track("second"));
	const first = queues.reserve("guild");
	assert.ok(first);
	assert.equal(queues.finish(first.queue, first.playbackId, false), true);

	const second = queues.reserve("guild");
	assert.ok(second);
	assert.equal(queues.finish(first.queue, first.playbackId, true), false);
	assert.equal(queues.currentTrack("guild")?.metadata.title, "second");

	queues.delete("guild");
	queues.add("guild", track("replacement"));
	assert.equal(queues.finish(second.queue, second.playbackId, false), false);
	assert.equal(queues.currentTrack("guild")?.metadata.title, "replacement");
});
