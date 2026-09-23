import { pool } from "./client";

export default async function configureDB(): Promise<void> {
	try {
		await pool.query("SELECT 1");
		console.log("Connected to PostgreSQL!");
	}
	catch (error) {
		await pool.end().catch(() => undefined);
		throw new Error("Could not connect to PostgreSQL.", { cause: error });
	}
}
