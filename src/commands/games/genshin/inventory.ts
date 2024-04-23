import {
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  MessageComponentInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import { Inventory, User } from "~/database/Schema";
import type { CharactersPerUser } from "~/types/GenshinTypes";

export default {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View all of your acquired genshin characters!")
    .addUserOption((user) =>
      user.setName("user").setDescription("Choose a user.").setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const interactionUser = interaction.options.getUser("user");
    const currentUserId = interactionUser ? interactionUser.id : interaction.user.id;

    if (interaction.user.bot || interactionUser?.bot) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle("Unable to perform action")
            .setDescription(
              `${interactionUser?.username || interaction.user.username} is a Discord Bot`
            ),
        ],
        ephemeral: true,
      });
      return;
    }

    const currentUser = await User.findOneAndUpdate(
      {
        discordId: currentUserId,
      },
      {},
      { upsert: true }
    );

    console.log("Current user id :" + currentUserId);

    const currentInventory = await Inventory.findOne({
      userId: currentUser?._id,
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

      rarity = i.customId === "4StarBtn" ? 4 : 5;

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
