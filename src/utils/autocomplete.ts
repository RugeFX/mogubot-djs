export type AutocompleteChoice = { name: string; value: string };

type Responder = {
	createdTimestamp: number;
	respond(choices: AutocompleteChoice[]): Promise<void>;
};

/** Leave time for Discord to receive the response before its three-second deadline. */
export async function respondAutocompleteWithinDeadline(
	interaction: Responder,
	lookup: () => Promise<AutocompleteChoice[]>,
	maxAgeMs = 2_000,
): Promise<void> {
	const remaining = interaction.createdTimestamp + maxAgeMs - Date.now();
	let choices: AutocompleteChoice[] = [];
	let timer: ReturnType<typeof setTimeout> | undefined;

	if (remaining > 0) {
		try {
			choices = await Promise.race([
				Promise.resolve().then(lookup),
				new Promise<AutocompleteChoice[]>((resolve) => {
					timer = setTimeout(() => resolve([]), remaining);
				}),
			]);
		}
		catch (error) {
			console.error("Autocomplete lookup failed:", error);
		}
		finally {
			if (timer) clearTimeout(timer);
		}
	}

	try {
		await interaction.respond(choices);
	}
	catch (error) {
		if (typeof error === "object" && error !== null && "code" in error && error.code === 10062) {
			console.warn("Autocomplete interaction expired before Discord accepted it.");
			return;
		}
		throw error;
	}
}
