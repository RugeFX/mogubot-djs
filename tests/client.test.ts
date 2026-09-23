import assert from "node:assert/strict";
import test from "node:test";
import Client from "../src/config/client";

test("constructs bot client without redefining Discord.js's token field", () => {
	const client = new Client("not-a-real-token", "unused-commands-path");
	assert.equal(client.token, null);
	assert.equal(Object.getOwnPropertyDescriptor(client, "token")?.configurable, false);
});
