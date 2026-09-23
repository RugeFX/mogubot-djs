# Character catalog input

`characters.json` contains 124 seeder-ready entries derived from [dvaJi/genshin-data](https://github.com/dvaJi/genshin-data/tree/master/src/data/english/characters) at commit `10f796ee2da959d403fb7db002b4e56367f6ded0`. The source fields are `name`, `element.name` (mapped to `vision`), and `rarity`. Three source records lack a usable vision and are listed in `characters-skipped.json`; no vision was invented for them.

That repository does not include character images. The `image` URLs for 123 entries point to [Paimon Moe](https://github.com/MadeBaruna/paimon-moe/tree/main/static/images/characters) icons pinned to commit `0a88d5391005a4331a1413966528dd1762ce2614`. Traveler (Cryo) uses a verified but unpinned [Enka.Network](https://enka.network/) **generic female Traveler portrait**, not a Cryo-specific icon, because its Paimon Moe icon is unavailable. These are externally hosted URLs, not image files copied into this repository; availability may change. License notices for the data and icon repositories are in `GENSHIN_DATA_LICENSE.txt` and `PAIMON_MOE_LICENSE.txt`. Those MIT notices do not grant rights to HoYoverse's game artwork.

`npm run db:seed` loads `data/characters.json` by default. You can pass a different JSON file as the first argument or set `CHARACTER_CATALOG_FILE` in `.env`.

The file must contain a non-empty JSON array. Each entry has this shape:

```json
{
  "name": "Character name",
  "image": "https://example.invalid/character.png",
  "rarity": 4,
  "vision": "Pyro"
}
```

Only `rarity` values `4` and `5` are accepted. Re-running the seed updates the catalog row with the same name instead of creating duplicates. The generated catalog is included, so `/wish` can use it after seeding.
