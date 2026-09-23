# MoguBot (Discord.js)

## Docker Compose

This branch uses PostgreSQL and Drizzle; Compose starts the database, applies the checked-in migrations, then starts the bot. It does not expose a host port.

1. Copy `.env.example` to `.env`. Set `TOKEN` and `POSTGRES_PASSWORD` (use URL-safe characters: letters, digits, `_`, `.`, `~`, `-`). `.env` is ignored by Git and excluded from the Docker build context. The `DATABASE_URL` field is for running outside Compose; Compose supplies its own internal URL.
2. Run `docker compose up --build -d` and check `docker compose logs -f migrate bot`.
3. Stop with `docker compose down`. The `postgres_data` volume persists; **`docker compose down -v` deletes the local database**.

The migration service runs `npm run db:migrate` on startup and the bot waits for it to finish successfully. A generated character catalog is included; see `data/README.md` for sources and exclusions. To seed `data/characters.json` after startup, run `docker compose run --rm -v "$(pwd)/data:/app/data:ro" migrate npm run db:seed`.

This is a development scaffold, not a production deployment recipe. Back up the database volume and manage credentials appropriately before deploying.
