import { Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { requireVoiceConnection } from "~/guards/voice-channel";
import Command from "~/types/command";

export default {
	data: new SlashCommandBuilder()
		.setName("queue")
		.setDescription("Check the current server's music queue."),
	async execute(interaction) {
		const ctx = await requireVoiceConnection(interaction);
		if (!ctx) return;

		const queue = interaction.client.queues.get(interaction.guildId);

		if (!queue || !queue.audios.length) {
			await interaction.reply({ content: "There is no music in the queue." });
			return;
		}

		const tracks = interaction.client.queues.tracks(interaction.guildId);
		const lines = tracks.map((music, i) => i === 0
			? `**${i + 1} - ${music.metadata.title} ${queue.repeatMode === "current" ? "(Repeating)" : "(Currently Playing)"}**`
			: `${i + 1} - ${music.metadata.title}`);
		let description = "";
		for (let i = 0; i < lines.length; i++) {
			const remaining = lines.length - i - 1;
			const suffix = remaining ? `\n… and ${remaining} more` : "";
			if (description.length + lines[i].length + suffix.length + 1 > 1024) {
				description += `\n… and ${lines.length - i} more`;
				break;
			}
			description += `${description ? "\n" : ""}${lines[i]}`;
		}
		if (description.length > 1024) description = description.slice(0, 1023) + "…";

		const queueEmbed = new EmbedBuilder()
			.setThumbnail(interaction.guild.iconURL())
			.setColor(Colors.Blue)
			.setTitle(`Music Queue ${queue.repeatMode === "all" ? "(Repeating Queue)" : ""}`)
			.setDescription(`Current music queue for ${interaction.guild.name}`)
			.addFields({ name: "Queue", value: description });

		await interaction.reply({
			embeds: [queueEmbed],
		});
	},
} as Command;
