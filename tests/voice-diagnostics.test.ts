import assert from "node:assert/strict";
import test from "node:test";
import { VoiceConnectionDisconnectReason, VoiceConnectionStatus, type VoiceConnectionState } from "@discordjs/voice";
import { describeVoiceState } from "../src/utils/voice-diagnostics";

test("voice diagnostics expose a disconnect reason and code without connection secrets", () => {
	const state = {
		status: VoiceConnectionStatus.Disconnected,
		reason: VoiceConnectionDisconnectReason.WebSocketClose,
		closeCode: 4014,
		endpoint: "private-endpoint",
		token: "private-token",
	} as unknown as VoiceConnectionState;
	assert.equal(describeVoiceState(state), "disconnected (reason=WebSocketClose, closeCode=4014)");
});

test("voice diagnostics identify the phase when a connection times out", () => {
	const state = { status: VoiceConnectionStatus.Connecting, token: "private-token" } as unknown as VoiceConnectionState;
	assert.equal(describeVoiceState(state), "connecting");
});

test("voice diagnostics omit a stale close code after a non-WebSocket disconnect", () => {
	const state = {
		status: VoiceConnectionStatus.Disconnected,
		reason: VoiceConnectionDisconnectReason.EndpointRemoved,
		closeCode: 4014,
	} as unknown as VoiceConnectionState;
	assert.equal(describeVoiceState(state), "disconnected (reason=EndpointRemoved)");
});
