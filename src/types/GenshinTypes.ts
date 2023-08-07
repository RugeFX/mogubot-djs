import { Document } from "mongoose";

export interface IUser extends Document {
  discordId: number;
}

export interface Talent {
  name: string;
  unlock: string;
  description: string;
  upgrades: Upgrade[];
  type: "NORMAL_ATTACK" | "ELEMENTAL_SKILL" | "ELEMENTAL_BURST";
}

export interface Upgrade {
  name: string;
  value: string;
}

export interface PassiveTalent {
  name: string;
  unlock: string;
  description: string;
  level?: number;
}

export interface Constellation {
  name: string;
  unlock: string;
  description: string;
  level: number;
}

export interface ICharacter extends Document {
  name: string;
  vision: string;
  rarity: number;
  image: string;
}

export interface CharacterAPIType {
  name: string;
  title: string;
  vision: string;
  weapon: string;
  nation: string;
  affiliation: string;
  rarity: number;
  constellation: string;
  birthday: string;
  description: string;
  skillTalents: Talent[];
  passiveTalents: PassiveTalent[];
  constellations: Constellation[];
}

export interface IInventory extends Document {
  userId: IUser["_id"];
  charactersId?: CharactersPerUser[];
}

export interface CharactersPerUser {
  characterId: ICharacter;
  constellation: number;
}
