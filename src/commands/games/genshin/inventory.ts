import { ChatInputCommandInteraction, Colors } from "discord.js";
import { SlashCommandBuilder, EmbedBuilder } from "@discordjs/builders";
import { Inventory, User } from "../../../mongoose/Schema";
import { CharactersPerUser, ICharacter } from "src/types/GenshinTypes";

export default {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View all of your acquired genshin characters!")
    .addUserOption((user) =>
      user.setName("user").setDescription("Choose a user.").setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    let currentUser = await User.findOne({
      discordId: interaction.user.id,
    });
    let interactionUser = interaction.options.getUser("user");

    if (interactionUser !== null) {
      currentUser = await User.findOne({
        discordId: interactionUser.id,
      });
    } else if (!currentUser) {
      currentUser = await User.create({
        discordId: interaction.user.id,
      });
    }

    console.log(currentUser?.id, interactionUser?.id);

    const currentInventory = await Inventory.findOne({
      userId: currentUser?._id,
    }).populate({
      path: "charactersId",
      populate: { path: "characterId" },
    });

    if (!currentUser || !currentInventory?.charactersId) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle("Characters")
            .setDescription(`${interactionUser?.username}'s characters`)
            .addFields({
              name: "No characters",
              value: "You have no characters in your inventory!",
            }),
        ],
      });
      return;
    }

    const fiveStarCharacters = currentInventory.charactersId?.filter(
      (c) => c.characterId.rarity === 5
    );
    const fourStarCharacters = currentInventory.charactersId?.filter(
      (c) => c.characterId.rarity === 4
    );

    const baseEmbed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle("Characters")
      .setDescription(`${interactionUser?.username}'s characters`)
      .addFields({
        name: "5 Stars",
        value:
          fiveStarCharacters.length > 0
            ? constructWishString(fiveStarCharacters)
            : "You have no 5 stars characters!",
      })
      .addFields({
        name: "4 Stars",
        value:
          fourStarCharacters.length > 0
            ? constructWishString(fourStarCharacters)
            : "You have no 4 stars characters!",
      });
    await interaction.reply({ embeds: [baseEmbed] });
  },
};

function constructWishString(characters: CharactersPerUser[]): string {
  return characters
    .map(
      ({
        characterId,
        constellation,
      }: {
        characterId: ICharacter;
        constellation: number;
      }) => {
        if (constellation > 0) return `${characterId.name} C${constellation}`;
        return characterId.name;
      }
    )
    .join("\n");
}
