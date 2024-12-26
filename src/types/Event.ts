export interface Event {
	on: string;
	once?: boolean;
	handler: (...args: unknown[]) => void;
}