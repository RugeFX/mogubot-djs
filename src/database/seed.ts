import "dotenv/config";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { closeDB } from "./client";
import { seedCharacters } from "./genshin-repository";
import type { CharacterSeed } from "./schema";

async function main(): Promise<void> {
	const catalogPath = resolve(
		process.argv[2] ?? process.env.CHARACTER_CATALOG_FILE ?? "data/characters.json",
	);
	const raw = await readFile(catalogPath, "utf8");
	const parsed: unknown = JSON.parse(raw);

	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error(`Expected a non-empty JSON array in ${catalogPath}.`);
	}

	const records = parsed as CharacterSeed[];
	const count = await seedCharacters(records);
	console.log(`Upserted ${count} characters from ${catalogPath}.`);
}

void main()
	.catch((error: unknown) => {
		console.error("Character catalog seeding failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await closeDB();
	});
