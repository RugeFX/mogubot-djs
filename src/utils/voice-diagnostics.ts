import { VoiceConnectionDisconnectReason, VoiceConnectionStatus, type VoiceConnectionState } from "@discordjs/voice";

/** Only report non-sensitive voice state metadata. Never print raw voice debug events. */
export function describeVoiceState(state: VoiceConnectionState): string {
	if (state.status !== VoiceConnectionStatus.Disconnected) return state.status;
	const reason = VoiceConnectionDisconnectReason[state.reason];
	const code = state.reason === VoiceConnectionDisconnectReason.WebSocketClose && "closeCode" in state
		? `, closeCode=${state.closeCode}`
		: "";
	return `${state.status} (reason=${reason}${code})`;
}
