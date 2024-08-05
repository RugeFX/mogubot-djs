import mongoose from "mongoose";

export default async function configureDB() {
	try {
		await mongoose.connect(process.env.DATABASE_URL!);

		console.log("Connected to DB!");
	}
	catch (err) {
		console.log("DB Error :" + err);
	}
}
