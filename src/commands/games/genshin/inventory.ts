import { ChatInputCommandInteraction, Colors } from "discord.js";
import { SlashCommandBuilder, EmbedBuilder } from "@discordjs/builders";

export default {
  data: new SlashCommandBuilder()
    .setName("characters")
    .setDescription("View all of your acquired genshin characters!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const inventoryEmbed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle("Characters")
      .setDescription(`${interaction.user.username}'s characters`);
    await interaction.reply({ embeds: [inventoryEmbed] });
  },
};
