import { Collection } from "discord.js";
import fs from "fs";
import path from "path";
import type Command from "src/types/Command";

/**
 * Reads all of the commands recursively from the path in the directory parameter and pushes it into the collection
 * @param {Collection<string, Command>} collection the commands collection object
 * @param {string} directory the directory path string
 */
export default function readCommands(collection: Collection<string, Command>, directory: string) {
  fs.readdirSync(directory).forEach((file) => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      readCommands(collection, filePath);
    } else if (file.endsWith(".ts") || file.endsWith(".js")) {
      const command = require(filePath).default as Command;
      collection.set(command.data.name, command);
      console.log(`Done loading command : ${command.data.name}`);
    } else {
      return;
    }
  });
}
