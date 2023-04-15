import { ChatInputCommandInteraction, Colors } from "discord.js";
import { SlashCommandBuilder, EmbedBuilder } from "@discordjs/builders";
import axios from "axios";

const exampleEmbed = new EmbedBuilder()
  .setColor(Colors.White)
  .setTitle("Wishing")
  .setDescription("You recieved.....")
  .setImage("https://media.tenor.com/YQCvYWzR28wAAAAC/wishing.gif");

export default {
  data: new SlashCommandBuilder()
    .setName("wish")
    .setDescription("Wish genshin characters!"),
  async execute(interaction: ChatInputCommandInteraction) {
    const character = await wishRandomCharacter();
    const wishedEmbed = new EmbedBuilder()
      .setColor(character?.rarity === 5 ? Colors.Gold : Colors.Purple)
      .setTitle(`${character?.name}`)
      .setDescription(`You recieved ${character?.name}!`)
      .setImage(
        `https://api.genshin.dev/characters/${character?.name
          .split(" ")
          .join("-")
          .toLowerCase()}/icon-big`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [exampleEmbed] });
    setTimeout(() => {
      interaction.editReply({ embeds: [wishedEmbed] });
    }, 4380);
  },
};

async function wishRandomCharacter(): Promise<{
  name: string;
  rarity: number;
  vision: string;
} | null> {
  try {
    const characters = (await axios.get("https://api.genshin.dev/characters"))
      .data;
    const randomIndex = Math.floor(Math.random() * (characters.length + 1));
    const chosenCharacter: {
      name: string;
      rarity: number;
      vision: string;
    } = (
      await axios.get(
        `https://api.genshin.dev/characters/${characters[randomIndex]}`
      )
    ).data;
    return chosenCharacter;
  } catch (e) {
    console.error(e);
    return null;
  }
}
