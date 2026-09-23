import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL must be set to a PostgreSQL connection string.");
}

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });

pool.on("error", (error) => {
	console.error("Unexpected PostgreSQL pool error:", error);
});

export async function closeDB(): Promise<void> {
	await pool.end();
}
