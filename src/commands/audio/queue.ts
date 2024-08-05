import { getVoiceConnection } from "@discordjs/voice";
import { Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Command from "~/types/Command";

export default {
	data: new SlashCommandBuilder()
		.setName("queue")
		.setDescription("Check the current server's music queue."),
	async execute(interaction) {
		const voiceChannel = interaction.member.voice.channel;
		const voiceConnection = getVoiceConnection(interaction.guildId);
		const { client } = interaction;

		if (!voiceChannel || !voiceConnection) {
			await interaction.reply({
				content: "You must be in a voice channel to use this command!",
				ephemeral: true,
			});
			return;
		}

		const queue = client.musicQueues.get(interaction.guildId);

		if (!queue || !queue.audios.length) {
			await interaction.reply({ content: "There is no music in the queue." });
			return;
		}

		const queueEmbed =
			new EmbedBuilder()
				.setThumbnail(interaction.guild.bannerURL())
				.setColor(Colors.Blue)
				.setTitle("Music Queue")
				.setDescription(`Current music queue for ${interaction.guild.name}`)
				.addFields({ name: "Queue", value: queue.audios.map((music, i) => i === 0 ? `**${i + 1} - ${music.metadata.title} (Currently Playing)**` : `${i + 1} - ${music.metadata.title}`).join("\n") });

		await interaction.reply({
			embeds: [queueEmbed],
		});
	},
} as Command;
