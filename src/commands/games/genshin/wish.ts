import {
	ChatInputCommandInteraction,
	Colors,
	SlashCommandBuilder,
	EmbedBuilder,
} from "discord.js";

import { getCharactersByRarity, grantCharacterToUser } from "~/database/genshin-repository";
import type { CharacterRecord } from "~/database/schema";

export default {
	data: new SlashCommandBuilder().setName("wish").setDescription("Wish genshin characters!"),
	async execute(interaction: ChatInputCommandInteraction) {
		const character = await wishRandomCharacter();
		const constellation = await grantCharacterToUser(interaction.user.id, character.id);

		const wishingEmbed = constructWishingEmbed(character);
		const wishedEmbed = constructWishedEmbed(character);

		if (constellation > 0) {
			wishedEmbed.addFields({
				name: "Duplicate",
				value: `Your ${character.name}'s constellation is now on C${constellation}!`,
			});
		}

		await interaction.reply({ embeds: [wishingEmbed] });

		setTimeout(
			async () => {
				await interaction.editReply({ embeds: [wishedEmbed] });
			},
			character.rarity === 5 ? 4400 : 5200,
		);
	},
};

async function wishRandomCharacter(): Promise<CharacterRecord> {
	const [fiveStars, fourStars] = await Promise.all([
		getCharactersByRarity(5),
		getCharactersByRarity(4),
	]);
	const isFiveStar = randomGen([10, 90]) === 0;
	const candidates = isFiveStar ? fiveStars : fourStars;
	if (candidates.length === 0) {
		throw new Error(`No ${isFiveStar ? 5 : 4}-star characters are seeded in the catalog.`);
	}

	return candidates[Math.floor(Math.random() * candidates.length)]!;
}

function randomGen(probabilities: number[]): number {
	const thresholds: number[] = [];
	let sum = 0;

	for (let i = 0; i < probabilities.length - 1; i++) {
		sum += probabilities[i] / 100;
		thresholds[i] = sum;
	}

	const random = Math.random();
	let index = 0;
	while (index < thresholds.length && random >= thresholds[index]) {
		index++;
	}
	return index;
}

function constructWishingEmbed(character: CharacterRecord) {
	return new EmbedBuilder()
		.setColor(Colors.White)
		.setTitle("Wishing")
		.setDescription("You recieved.....")
		.setImage(
			character.rarity === 5
				? "https://media.tenor.com/YQCvYWzR28wAAAAC/wishing.gif"
				: "https://media.tenor.com/JcMSVVkgfgMAAAAC/genshin-wish.gif",
		);
}

function constructWishedEmbed(character: CharacterRecord) {
	return new EmbedBuilder()
		.setColor(character.rarity === 5 ? Colors.Gold : Colors.Purple)
		.setTitle(character.name)
		.setDescription(`You recieved ${character.name}!`)
		.setImage(character.image)
		.setTimestamp();
}
