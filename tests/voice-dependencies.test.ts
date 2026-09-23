import assert from "node:assert/strict";
import test from "node:test";
import { generateDependencyReport } from "@discordjs/voice";

test("voice runtime includes DAVE support required by Discord", () => {
	const report = generateDependencyReport();
	assert.match(report, /DAVE Libraries[\s\S]*@snazzah\/davey: (?!not found)\d/);
});
