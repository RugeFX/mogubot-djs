CREATE TABLE "characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text NOT NULL,
	"rarity" smallint NOT NULL,
	"vision" text NOT NULL,
	CONSTRAINT "characters_name_unique" UNIQUE("name"),
	CONSTRAINT "characters_rarity_check" CHECK ("characters"."rarity" IN (4, 5))
);
--> statement-breakpoint
CREATE TABLE "user_characters" (
	"user_id" text NOT NULL,
	"character_id" integer NOT NULL,
	"constellation" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "user_characters_user_id_character_id_pk" PRIMARY KEY("user_id","character_id"),
	CONSTRAINT "user_characters_constellation_check" CHECK ("user_characters"."constellation" >= 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"discord_id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_user_id_users_discord_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("discord_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE restrict ON UPDATE no action;