import { asc, desc, eq, sql } from "drizzle-orm";

import { db } from "./client";
import { characters, userCharacters, users } from "./schema";
import type { CharacterRarity, CharacterSeed } from "./schema";

export async function getCharactersByRarity(rarity: CharacterRarity) {
	return db.select().from(characters).where(eq(characters.rarity, rarity));
}

export async function getUserInventory(discordId: string) {
	return db
		.select({
			userId: userCharacters.userId,
			characterId: characters.id,
			name: characters.name,
			image: characters.image,
			rarity: characters.rarity,
			vision: characters.vision,
			constellation: userCharacters.constellation,
		})
		.from(userCharacters)
		.innerJoin(characters, eq(userCharacters.characterId, characters.id))
		.where(eq(userCharacters.userId, discordId))
		.orderBy(desc(characters.rarity), asc(characters.name));
}

export type UserInventoryCharacter = Awaited<ReturnType<typeof getUserInventory>>[number];

/** Returns the updated constellation (C0 for a first copy). */
export async function grantCharacterToUser(discordId: string, characterId: number): Promise<number> {
	return db.transaction(async (tx) => {
		await tx.insert(users).values({ discordId }).onConflictDoNothing();

		const [inventoryRow] = await tx
			.insert(userCharacters)
			.values({ userId: discordId, characterId, constellation: 0 })
			.onConflictDoUpdate({
				target: [userCharacters.userId, userCharacters.characterId],
				set: { constellation: sql`${userCharacters.constellation} + 1` },
			})
			.returning({ constellation: userCharacters.constellation });

		if (!inventoryRow) {
			throw new Error("The character award did not return an inventory row.");
		}

		return inventoryRow.constellation;
	});
}

/** Insert catalog rows or refresh their display data without creating duplicates. */
export async function seedCharacters(records: CharacterSeed[]): Promise<number> {
	if (records.length === 0) {
		throw new Error("The character catalog must contain at least one character.");
	}

	const names = new Set<string>();
	for (const record of records) {
		if (!record.name.trim() || !record.image.trim() || !record.vision.trim()) {
			throw new Error("Each character needs a non-empty name, image, and vision.");
		}
		if (record.rarity !== 4 && record.rarity !== 5) {
			throw new Error(`Unsupported rarity for ${record.name}: ${record.rarity}`);
		}
		if (names.has(record.name)) {
			throw new Error(`Duplicate character name in catalog input: ${record.name}`);
		}
		names.add(record.name);
	}

	await db
		.insert(characters)
		.values(records)
		.onConflictDoUpdate({
			target: characters.name,
			set: {
				image: sql`excluded.image`,
				rarity: sql`excluded.rarity`,
				vision: sql`excluded.vision`,
			},
		});

	return records.length;
}
