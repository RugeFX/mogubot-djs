import mongoose from "mongoose";
import { config } from "dotenv";
config();

export default async () => {
  mongoose.connection.on("connected", () => {
    console.log("Connected to DB!");
  });
  mongoose.connection.on("disconnected", () => {
    console.log("Disonnected from DB!");
  });
  mongoose.connection.on("err", (err) => {
    console.log("DB Error :" + err);
  });

  await mongoose.connect(process.env.DATABASE_URL as string);
};
