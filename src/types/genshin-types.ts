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
