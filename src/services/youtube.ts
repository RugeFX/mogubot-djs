import { Innertube, UniversalCache } from "youtubei.js";
import type { YTNodes } from "youtubei.js";
import type { ReadableStream } from "stream/web";

let innertubePromise: Promise<Innertube> | undefined;

async function getInnertube(): Promise<Innertube> {
	innertubePromise ??= Innertube.create({ cache: new UniversalCache(false) })
		.catch((error) => {
			innertubePromise = undefined;
			throw error;
		});
	return innertubePromise;
}

/** Extracts the YouTube video ID from a URL. Returns null if not a valid YouTube URL. */
export function extractVideoId(url: string): string | null {
	const match = url.match(
		/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|shorts|v)\/))([a-zA-Z0-9_-]{11})/,
	);
	return match ? match[1] : null;
}

/** Returns true if the string looks like a YouTube video URL. */
export function isValidYoutubeUrl(url: string): boolean {
	return extractVideoId(url) !== null;
}

/** Search YouTube for videos matching the query. */
export async function searchVideos(query: string, limit = 10): Promise<{ title: string; url: string }[]> {
	const innertube = await getInnertube();
	const result = await innertube.search(query, { type: "video" });

	return (
		result.results
			?.filter((item) => item.type === "Video")
			.slice(0, limit)
			.map((item) => {
				const video = item as YTNodes.Video;
				return {
					title: video.title.toString().slice(0, 100),
					url: `https://www.youtube.com/watch?v=${video.video_id}`,
				};
			}) ?? []
	);
}

/** Fetches basic video info (title, duration, etc.) for the given YouTube URL. */
export async function getVideoInfo(url: string): Promise<{ title?: string; duration?: number }> {
	const videoId = extractVideoId(url);
	if (!videoId) throw new Error(`Could not extract video ID from URL: ${url}`);

	const innertube = await getInnertube();
	const info = await innertube.getBasicInfo(videoId);
	return info.basic_info;
}

/** Downloads the audio stream for a YouTube video URL. */
export async function getAudioStream(url: string): Promise<ReadableStream<Uint8Array>> {
	const videoId = extractVideoId(url);
	if (!videoId) throw new Error(`Could not extract video ID from URL: ${url}`);

	const innertube = await getInnertube();
	const stream = await innertube.download(videoId, { type: "audio", quality: "best", format: "webm" });

	return stream as ReadableStream<Uint8Array>;
}
