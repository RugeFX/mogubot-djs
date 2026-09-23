import { getVoiceConnection, type VoiceConnection } from "@discordjs/voice";
import type { ChatInputCommandInteraction, VoiceBasedChannel } from "discord.js";

export interface VoiceChannelContext {
	voiceChannel: VoiceBasedChannel;
	voiceConnection: VoiceConnection;
}

/**
 * Checks that the user is in a voice channel and the bot has an active voice connection.
 * Sends an ephemeral reply and returns `null` if either check fails.
 */
export async function requireVoiceConnection(
	interaction: ChatInputCommandInteraction<"cached">,
): Promise<VoiceChannelContext | null> {
	const voiceChannel = interaction.member.voice.channel;
	const voiceConnection = getVoiceConnection(interaction.guildId);

	if (!voiceChannel || !voiceConnection) {
		await interaction.reply({
			content: "You must be in a voice channel to use this command!",
			ephemeral: true,
		});
		return null;
	}
	if (voiceConnection.joinConfig.channelId !== voiceChannel.id) {
		await interaction.reply({
			content: "You must be in the bot's voice channel to use this command!",
			ephemeral: true,
		});
		return null;
	}

	return { voiceChannel, voiceConnection };
}

/**
 * Checks that the user is in a voice channel (no active connection required).
 * Sends an ephemeral reply and returns `null` if the user is not in voice.
 */
export async function requireUserInVoice(
	interaction: ChatInputCommandInteraction<"cached">,
): Promise<VoiceBasedChannel | null> {
	const voiceChannel = interaction.member.voice.channel;

	if (!voiceChannel) {
		await interaction.reply({
			content: "You must be in a voice channel to use this command!",
			ephemeral: true,
		});
		return null;
	}
	const connection = getVoiceConnection(interaction.guildId);
	if (connection && connection.joinConfig.channelId !== voiceChannel.id) {
		await interaction.reply({
			content: "You must be in the bot's voice channel to use this command!",
			ephemeral: true,
		});
		return null;
	}

	return voiceChannel;
}
