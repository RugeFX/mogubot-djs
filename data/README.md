# Character catalog input

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

Only `rarity` values `4` and `5` are accepted. Re-running the seed updates the catalog row with the same name instead of creating duplicates. No character catalog dataset is included in this repository yet; add the chosen dataset at the path above before running `/wish`.
