import {
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  User as DJSUser,
  MessageComponentInteraction,
} from "discord.js";
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from "@discordjs/builders";
import { Inventory, User } from "../../../mongoose/Schema";
import type { CharactersPerUser, ICharacter, IUser } from "src/types/GenshinTypes";

export default {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View all of your acquired genshin characters!")
    .addUserOption((user) =>
      user.setName("user").setDescription("Choose a user.").setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    let currentUser: IUser | null;
    let interactionUser = interaction.options.getUser("user");

    console.log(interactionUser?.id);

    if (interactionUser !== null) {
      currentUser = await User.findOne({
        discordId: interactionUser.id,
      });
      if (!currentUser) {
        currentUser = await User.create({
          discordId: interactionUser.id,
        });
      }
    } else {
      currentUser = await User.findOne({
        discordId: interaction.user.id,
      });
      if (!currentUser) {
        currentUser = await User.create({
          discordId: interaction.user.id,
        });
      }
    }

    console.log("Current user id :" + currentUser);

    const currentInventory = await Inventory.findOne({
      userId: currentUser._id,
    }).populate({
      path: "charactersId",
      populate: { path: "characterId" },
    });

    const inventoryEmbed = () =>
      new EmbedBuilder()
        .setThumbnail(interactionUser?.avatarURL() || interaction.user.avatarURL({ size: 1024 }))
        .setColor(Colors.Blue)
        .setTitle("Characters")
        .setDescription(`${interactionUser?.username || interaction.user.username}'s characters`);

    if (!currentInventory?.charactersId) {
      await interaction.reply({
        embeds: [
          inventoryEmbed().addFields({
            name: "No characters",
            value: "You have no characters in your inventory!",
          }),
        ],
      });
      return;
    }

    const fiveStarCharacters = currentInventory.charactersId.filter(
      (c) => c.characterId.rarity === 5
    );
    const fourStarCharacters = currentInventory.charactersId.filter(
      (c) => c.characterId.rarity === 4
    );

    const fourStarsEmbed = inventoryEmbed().addFields({
      name: "4 Stars",
      value:
        fourStarCharacters.length > 0
          ? constructWishString(fourStarCharacters)
          : "You have no 4 stars characters!",
    });

    const fiveStarsEmbed = inventoryEmbed().addFields({
      name: "5 Stars",
      value:
        fiveStarCharacters.length > 0
          ? constructWishString(fiveStarCharacters)
          : "You have no 5 stars characters!",
    });

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("4StarBtn").setLabel("4★").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("5StarBtn").setLabel("5★").setStyle(ButtonStyle.Primary)
    );

    const response = await interaction.reply({ embeds: [fiveStarsEmbed], components: [actionRow] });

    const collectorFilter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;

    try {
      const component = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000,
      });

      if (component.customId === "4StarBtn") {
        await component.update({
          embeds: [fourStarsEmbed],
          components: [actionRow],
        });
      } else if (component.customId === "5StarBtn") {
        await component.update({
          embeds: [fiveStarsEmbed],
          components: [actionRow],
        });
      }
    } catch (e) {
      // await interaction.editReply({
      //   content: "Confirmation not received within 15 seconds, cancelling",
      //   components: [],
      // });
      console.error("time limit");
    }
  },
};

function constructWishString(characters: CharactersPerUser[]): string {
  return characters
    .map(({ characterId, constellation }) =>
      constellation > 0 ? `${characterId.name} C${constellation}` : characterId.name
    )
    .join("\n");
}
