import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	MessageComponentInteraction,
	SlashCommandBuilder,
} from "discord.js";

import { getUserInventory } from "~/database/genshin-repository";
import type { UserInventoryCharacter } from "~/database/genshin-repository";

export default {
	data: new SlashCommandBuilder()
		.setName("inventory")
		.setDescription("View all of your acquired genshin characters!")
		.addUserOption((user) =>
			user.setName("user").setDescription("Choose a user.").setRequired(false),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("user") ?? interaction.user;

		if (user.bot) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Red)
						.setTitle("Unable to perform action")
						.setDescription(`${user.username} is a Discord Bot`),
				],
				ephemeral: true,
			});
			return;
		}

		const inventory = await getUserInventory(user.id);
		const inventoryEmbed = () =>
			new EmbedBuilder()
				.setThumbnail(user.avatarURL({ size: 1024 }))
				.setColor(Colors.Blue)
				.setTitle("Characters")
				.setDescription(`${user.username}'s characters`);

		if (inventory.length === 0) {
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

		const fourStarCharacters = inventory.filter(character => character.rarity === 4);
		const fiveStarCharacters = inventory.filter(character => character.rarity === 5);
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
					.setDisabled(rarity === 5),
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

function constructWishString(characters: UserInventoryCharacter[]): string {
	return characters
		.map(({ name, constellation }) => constellation > 0 ? `${name} C${constellation}` : name)
		.join("\n");
}
