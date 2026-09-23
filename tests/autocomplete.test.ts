import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { respondAutocompleteWithinDeadline } from "../src/utils/autocomplete";

type Choice = { name: string; value: string };

function fakeInteraction(createdTimestamp = Date.now()) {
	const responses: Choice[][] = [];
	return {
		createdTimestamp,
		responses,
		respond: async (choices: Choice[]) => { responses.push(choices); },
	};
}

test("autocomplete falls back once before a slow lookup can expire", async () => {
	const interaction = fakeInteraction();
	let finishSearch!: (choices: Choice[]) => void;
	const search = () => new Promise<Choice[]>((resolve) => { finishSearch = resolve; });

	await respondAutocompleteWithinDeadline(interaction, search, 20);
	assert.deepEqual(interaction.responses, [[]]);
	finishSearch([{ name: "late", value: "late" }]);
	await delay(0);
	assert.deepEqual(interaction.responses, [[]]);
});

test("autocomplete returns fast results", async () => {
	const interaction = fakeInteraction();
	const choices = [{ name: "song", value: "https://example.test/song" }];
	await respondAutocompleteWithinDeadline(interaction, async () => choices, 500);
	assert.deepEqual(interaction.responses, [choices]);
});

test("autocomplete does not retry an expired Discord callback", async () => {
	let attempts = 0;
	const interaction = {
		createdTimestamp: Date.now() - 10_000,
		respond: async (_choices: Choice[]) => { attempts++; throw { code: 10062 }; },
	};
	await respondAutocompleteWithinDeadline(interaction, async () => [], 20);
	assert.equal(attempts, 1);
});

test("autocomplete skips a lookup if its deadline has already passed", async () => {
	const interaction = fakeInteraction(Date.now() - 10_000);
	let searched = false;
	await respondAutocompleteWithinDeadline(interaction, async () => { searched = true; return []; }, 20);
	assert.equal(searched, false);
	assert.deepEqual(interaction.responses, [[]]);
});
