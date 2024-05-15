import { Collection } from 'discord.js';
import fs from 'node:fs/promises';
import path from 'path';
import type Command from '~/types/Command';

/**
 * Reads all of the commands recursively from the path in the directory parameter and pushes it into the collection
 * @param {string} directory the commands directory path as a string
 */
export default async function readCommands(
	collection: Collection<string, Command>,
	directory: string,
) {
	const files = await fs.readdir(directory, { recursive: true });

	for (const file of files) {
		const filePath = path.join(directory, file);

		if (file.endsWith('.ts') || file.endsWith('.js')) {
			const { default: command }: {default: Command} = await import(filePath);
			collection.set(command.data.name, command);
			console.log(`Done loading command : ${command.data.name}`);
		}
	}
}
