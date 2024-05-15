import { ChatInputCommandInteraction, Colors, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Character } from '~/database/Schema';
import { addCharacterToInventory, getCurrentInventory } from '~/utils/genshin';
import type { ICharacter } from '~/types/GenshinTypes';

export default {
	data: new SlashCommandBuilder().setName('wish').setDescription('Wish genshin characters!'),
	async execute(interaction: ChatInputCommandInteraction) {
		const character = await wishRandomCharacter();
		const currentInventory = await getCurrentInventory(interaction.user.id);

		const wishingEmbed = constructWishingEmbed(character);
		const wishedEmbed = constructWishedEmbed(character);

		const alreadyHasCharacter = currentInventory.charactersId?.find((c) =>
			character._id.equals(c.characterId),
		);
		if (alreadyHasCharacter !== undefined) {
			wishedEmbed.addFields({
				name: 'Duplicate',
				value: `Your ${character.name}'s constellation is now on C${
					alreadyHasCharacter.constellation + 1
				}!`,
			});
		}

		await addCharacterToInventory(currentInventory, character);
		await interaction.reply({ embeds: [wishingEmbed] });

		setTimeout(
			async () => {
				await interaction.editReply({ embeds: [wishedEmbed] });
			},
			character.rarity === 5 ? 4400 : 5200,
		);
	},
};

async function wishRandomCharacter(): Promise<ICharacter> {
	const characters: ICharacter[] = await Character.find();
	const fiveStars = characters.filter((c) => c.rarity === 5);
	const fourStars = characters.filter((c) => c.rarity === 4);
	const gacha: number = randomGen([10, 90]);
	// const randomIndex = Math.floor(Math.random() * (characters.length + 1));
	if (gacha === 0) {
		return fiveStars[Math.floor(Math.random() * (fiveStars.length + 1))];
	}
	return fourStars[Math.floor(Math.random() * (fourStars.length + 1))];
}

function randomGen(probas: number[]) {
	const ar: number[] = [];
	let i = 0;
	let sum = 0;

	for (i = 0; i < probas.length - 1; i++) {
		sum += probas[i] / 100.0;
		ar[i] = sum;
	}

	const r = Math.random();

	for (i = 0; i < ar.length && r >= ar[i]; i++);

	return i;
}

function constructWishingEmbed(character: ICharacter) {
	return new EmbedBuilder()
		.setColor(Colors.White)
		.setTitle('Wishing')
		.setDescription('You recieved.....')
		.setImage(
			character.rarity === 5
				? 'https://media.tenor.com/YQCvYWzR28wAAAAC/wishing.gif'
				: 'https://media.tenor.com/JcMSVVkgfgMAAAAC/genshin-wish.gif',
		);
}

function constructWishedEmbed(character: ICharacter) {
	return new EmbedBuilder()
		.setColor(character.rarity === 5 ? Colors.Gold : Colors.Purple)
		.setTitle(`${character.name}`)
		.setDescription(`You recieved ${character.name}!`)
		.setImage(`${character.image}`)
		.setTimestamp();
}
