import { getVoiceConnection } from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import Command from "~/types/Command";

export default {
	data: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stops the bot from playing music."),
	async execute(interaction) {
		const voiceChannel = interaction.member.voice.channel;
		const voiceConnection = getVoiceConnection(interaction.guildId);

		if (!voiceChannel || !voiceConnection) {
			await interaction.reply({
				content: "You must be in a voice channel to use this command!",
				ephemeral: true,
			});
			return;
		}

		interaction.client.musicQueues.delete(interaction.guildId);
		voiceConnection.destroy();

		await interaction.reply({
			content: `**Left voice channel \`${voiceChannel.name}\`**`,
		});
	},
} as Command;
