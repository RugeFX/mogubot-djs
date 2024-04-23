import { Schema, Types, model } from "mongoose";
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

const Character = model<ICharacter>("Character", characterSchema);
const Inventory = model<IInventory>("Inventory", inventorySchema);
const User = model<IUser>("User", userSchema);

export { User, Character, Inventory };
