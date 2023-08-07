import { Model, Schema, Types, model } from "mongoose";
import { ICharacter, IInventory, IUser } from "../types/GenshinTypes";

const characterSchema = new Schema<ICharacter>({
  name: { type: String, required: true },
  image: { type: String, required: true },
  rarity: { type: Number, required: true },
  vision: { type: String, required: true },
});

const inventorySchema = new Schema<IInventory>({
  userId: {
    type: Types.ObjectId,
    ref: "User",
  },
  charactersId: [
    {
      characterId: {
        type: Types.ObjectId,
        ref: "Character",
      },
      constellation: Number,
    },
  ],
});

const userSchema = new Schema<IUser>({
  discordId: Number,
});

export const Character: Model<ICharacter> = model("Character", characterSchema);
export const Inventory: Model<IInventory> = model("Inventory", inventorySchema);
export const User: Model<IUser> = model("User", userSchema);
