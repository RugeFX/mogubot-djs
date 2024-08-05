import { Inventory, User } from "../database/Schema";
import { ICharacter, IInventory } from "../types/GenshinTypes";

/**
 * Get current user's inventory provided by the user id parameter
 * @param {string} currentUserId user's id
 * @returns {Promise<IInventory>} the user's inventory object wrapped in a Promise
 */
export const getCurrentInventory = async (currentUserId: string): Promise<IInventory> => {
	let currentUser = await User.findOne({
		discordId: currentUserId,
	});
	if (!currentUser) {
		currentUser = await User.create({
			discordId: currentUserId,
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

	return currentInventory;
};

/**
 * Adds a character to the inventory
 * @param {IInventory} inventory inventory object to store the character into
 * @param {ICharacter} character the character to store
 * @returns {Promise<void>} a void Promise
 */
export const addCharacterToInventory = async (
	inventory: IInventory,
	character: ICharacter,
): Promise<void> => {
	console.log(`Adding ${character.name} to inventory with user id: ${inventory.userId}`);

	if (inventory.charactersId === undefined || inventory.charactersId.length < 1) {
		inventory.charactersId = [
			{
				characterId: character,
				constellation: 0,
			},
		];
	}
	else {
		const findChara = inventory.charactersId.find((c) => character._id?.equals(c.characterId._id));
		if (!findChara) {
			inventory.charactersId.push({
				characterId: character,
				constellation: 0,
			});
		}
		else {
			findChara.constellation += 1;
		}
	}
	await inventory.save();
};
