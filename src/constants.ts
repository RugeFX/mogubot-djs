import { join } from "path";
import { readdirSync } from "fs";

/** Root directory of the project (resolves to the repo root regardless of build output). */
export const ROOT_DIR = join(__dirname, "..");

/** Path to the local audio assets folder. */
export const ASSETS_AUDIO_DIR = join(ROOT_DIR, "assets/audio");

/** Map of music name → filename for locally available audio files. */
export const LOCAL_MUSIC_LIST = readdirSync(ASSETS_AUDIO_DIR)
	.filter((file) => file.endsWith(".mp3"))
	.reduce((acc, file) => {
		acc[file.split(".")[0]] = file;
		return acc;
	}, {} as Record<string, string>);
