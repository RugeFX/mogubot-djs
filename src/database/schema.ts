import { sql } from "drizzle-orm";
import {
	check,
	integer,
	pgTable,
	primaryKey,
	serial,
	smallint,
	text,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	discordId: text("discord_id").primaryKey(),
});

export const characters = pgTable("characters", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique(),
	image: text("image").notNull(),
	rarity: smallint("rarity").notNull(),
	vision: text("vision").notNull(),
}, table => ({
	rarityCheck: check("characters_rarity_check", sql`${table.rarity} IN (4, 5)`),
}));

export const userCharacters = pgTable("user_characters", {
	userId: text("user_id")
		.notNull()
		.references(() => users.discordId, { onDelete: "cascade" }),
	characterId: integer("character_id")
		.notNull()
		.references(() => characters.id, { onDelete: "restrict" }),
	constellation: smallint("constellation").notNull().default(0),
}, table => ({
	primaryKey: primaryKey({ columns: [table.userId, table.characterId] }),
	constellationCheck: check("user_characters_constellation_check", sql`${table.constellation} >= 0`),
}));

export type CharacterRecord = typeof characters.$inferSelect;
export type CharacterSeed = Pick<CharacterRecord, "name" | "image" | "rarity" | "vision">;
export type CharacterRarity = 4 | 5;
