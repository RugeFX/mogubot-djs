import { ChatInputCommandInteraction, Colors } from "discord.js";
import { SlashCommandBuilder, EmbedBuilder } from "@discordjs/builders";
import connection from "../../../mongoose/connection";
import { Character, Inventory, User } from "../../../mongoose/Schema";
import { ICharacter } from "../../../types/GenshinTypes";
import { ObjectId } from "mongodb";

const wishingEmbed = new EmbedBuilder()
  .setColor(Colors.White)
  .setTitle("Wishing")
  .setDescription("You recieved.....")
  .setImage("https://media.tenor.com/YQCvYWzR28wAAAAC/wishing.gif");

export default {
  data: new SlashCommandBuilder()
    .setName("wish")
    .setDescription("Wish genshin characters!"),
  async execute(interaction: ChatInputCommandInteraction) {
    await connection();

    const character = await wishRandomCharacter();
    const wishedEmbed = new EmbedBuilder()
      .setColor(character?.rarity === 5 ? Colors.Gold : Colors.Purple)
      .setTitle(`${character?.name}`)
      .setDescription(`You recieved ${character?.name}!`)
      .setImage(`${character?.image}`)
      .setTimestamp();

    let currentUser = await User.findOne({
      discordId: interaction.user.id,
    });
    if (!currentUser) {
      currentUser = await User.create({
        discordId: interaction.user.id,
      });
    }

    let currentInventory = await Inventory.findOne({
      userId: currentUser._id,
    });
    if (!currentInventory) {
      currentInventory = await Inventory.create({
        userId: currentUser._id,
      });
    }

    if (
      currentInventory.charactersId === undefined ||
      currentInventory.charactersId.length < 1
    ) {
      currentInventory.charactersId = [
        {
          characterId: character._id,
          constellation: 0,
        },
      ];
    } else {
      const findChara = currentInventory.charactersId.findIndex(
        (c) => c.characterId === character._id
      );
      if (findChara === -1) {
        currentInventory.charactersId.push({
          characterId: character._id,
          constellation: 0,
        });
      } else {
        currentInventory.charactersId[findChara].constellation += 1;
      }
    }
    await currentInventory.save();

    await interaction.reply({ embeds: [wishingEmbed] });
    setTimeout(async () => {
      await interaction.editReply({ embeds: [wishedEmbed] });
    }, 4380);
  },
};

async function wishRandomCharacter(): Promise<ICharacter> {
  const characters: ICharacter[] = await Character.find();
  const randomIndex = Math.floor(Math.random() * (characters.length + 1));
  return characters[randomIndex];
}
