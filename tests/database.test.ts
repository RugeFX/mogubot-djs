import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

test("PostgreSQL catalog seeding is repeatable and wish grants are atomic", {
	skip: !testDatabaseUrl,
}, async () => {
	process.env.DATABASE_URL = testDatabaseUrl!;

	const [{ db, pool }, { migrate }, schema, repository, { eq }] = await Promise.all([
		import("../src/database/client"),
		import("drizzle-orm/node-postgres/migrator"),
		import("../src/database/schema"),
		import("../src/database/genshin-repository"),
		import("drizzle-orm"),
	]);

	await migrate(db, { migrationsFolder: "drizzle" });

	const discordId = (140737488355328000n + BigInt(`0x${randomUUID().replaceAll("-", "").slice(0, 6)}`)).toString();
	const name = `Test Character ${randomUUID()}`;

	try {
		await repository.seedCharacters([
			{ name, image: "https://example.test/old.png", rarity: 5, vision: "Pyro" },
		]);
		await repository.seedCharacters([
			{ name, image: "https://example.test/new.png", rarity: 5, vision: "Cryo" },
		]);

		const catalog = await repository.getCharactersByRarity(5);
		const character = catalog.find((item) => item.name === name);
		assert.ok(character);
		assert.equal(character.image, "https://example.test/new.png");
		assert.equal(character.vision, "Cryo");

		assert.equal(await repository.grantCharacterToUser(discordId, character.id), 0);
		assert.equal(await repository.grantCharacterToUser(discordId, character.id), 1);

		const concurrentConstellations = await Promise.all(
			Array.from({ length: 8 }, () => repository.grantCharacterToUser(discordId, character.id)),
		);
		assert.deepEqual(
			[...concurrentConstellations].sort((left, right) => left - right),
			[2, 3, 4, 5, 6, 7, 8, 9],
		);

		const inventory = await repository.getUserInventory(discordId);
		assert.equal(inventory.length, 1);
		assert.equal(inventory[0].userId, discordId);
		assert.equal(inventory[0].name, name);
		assert.equal(inventory[0].constellation, 9);
	}
	finally {
		await db.delete(schema.userCharacters).where(eq(schema.userCharacters.userId, discordId));
		await db.delete(schema.users).where(eq(schema.users.discordId, discordId));
		await db.delete(schema.characters).where(eq(schema.characters.name, name));
		await pool.end();
	}
});
