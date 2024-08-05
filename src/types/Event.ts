export interface Event {
	on: string;
	type: "once" | "on";
	handler: (...args: unknown[]) => void;
}