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

    const charactersEmbed = (rarity: number) =>
      inventoryEmbed().addFields({
        name: rarity === 4 ? "4 Stars" : "5 Stars",
        value:
          rarity === 4
            ? fourStarCharacters.length > 0
              ? constructWishString(fourStarCharacters)
              : "You have no 4 stars characters!"
            : fiveStarCharacters.length > 0
            ? constructWishString(fiveStarCharacters)
            : "You have no 5 stars characters!",
      });

    const actionRow = (rarity: number) =>
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("4StarBtn")
          .setLabel("4★")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(rarity === 4),
        new ButtonBuilder()
          .setCustomId("5StarBtn")
          .setLabel("5★")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(rarity === 5)
      );

    let rarity = 5;

    await interaction.deferReply();
    const response = await interaction.editReply({
      embeds: [charactersEmbed(rarity)],
      components: [actionRow(rarity)],
    });

    const collectorFilter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;

    const collector = response.createMessageComponentCollector({
      filter: collectorFilter,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) return;

      if (i.customId === "4StarBtn") rarity = 4;
      else rarity = 5;

      await i.deferUpdate();

      await i.editReply({
        embeds: [charactersEmbed(rarity)],
        components: [actionRow(rarity)],
      });

      collector.resetTimer();
    });

    collector.on("end", async () => {
      await response.edit({
        embeds: [charactersEmbed(rarity)],
        components: [],
      });
    });
  },
};

function constructWishString(characters: CharactersPerUser[]): string {
  return characters
    .map(({ characterId, constellation }) =>
      constellation > 0 ? `${characterId.name} C${constellation}` : characterId.name
    )
    .join("\n");
}
