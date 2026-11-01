import type { Result } from "../core/task";
import type { Song } from "../core/library";
import type { TrackMetadata } from "./resolver";
import { MUSIC_PATH } from "../core/config";
import path from "node:path";
import Fuse from "fuse.js";

// Sanitize filenames
const ILLEGAL = /[\/\?<>\\:\*\|":]/g;
const CONTROL = /[\x00-\x1f\x80-\x9f]/g;
const RESERVED = /^\.+$/;
const WINDOWS = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
const REPLACEMENT = "_";

function sanitize(input: string): string {
  return input
    .replace(ILLEGAL, REPLACEMENT)
    .replace(CONTROL, REPLACEMENT)
    .replace(RESERVED, REPLACEMENT)
    .replace(WINDOWS, REPLACEMENT);
}

// Get track source
type VideoMetadata = {
  id: string;
  channel: string;
  title: string;
  durationMs: number;
};

type ScoredVideo = VideoMetadata & {
  score: number;
};

async function getVideos(track: TrackMetadata, count: number): Promise<Result<ScoredVideo[]>> {
  const query = `ytsearch${count}:${track.album.artist.name} - ${track.name}`;
  const format = "%(id)s>%(channel)s>%(title)s>%(duration)s";
  const args = ["yt-dlp", "--simulate", "--print", format, query];
  const process = Bun.spawn(args, { stderr: "ignore" });
  const output = (await process.stdout.text()).trim();

  if (!output) {
    return {
      success: false,
      error: "No videos found",
    };
  }

  const videos = output
    .split("\n")
    .map((e) => {
      const split = e.split(">");
      return {
        id: split[0] || "",
        channel: split[1] || "",
        title: split[2] || "",
        durationMs: parseInt(split[3] ?? "0") * 1000,
      };
    })
    .filter((v) => v.id && v.title) as VideoMetadata[];

  // Score videos
  const fuse = new Fuse(videos, {
    keys: [
      { name: "title", weight: 0.7 },
      { name: "channel", weight: 0.3 },
    ],
    threshold: 1.0,
    ignoreDiacritics: true,
    ignoreLocation: true,
    findAllMatches: true,
    includeScore: true,
  });

  const fuseResults = fuse.search(`${track.album.artist.name} ${track.name} audio`);

  let scoredVideos = fuseResults.map((result) => ({
    ...result.item,
    score: result.score ?? 1,
  }));

  scoredVideos = scoredVideos.map((e) => {
    let score = e.score;

    // Check for exact match
    const trackName = track.name.toLowerCase();
    const title = e.title.toLowerCase();
    const titleMatch = title == trackName;
    const artistName = track.album.artist.name.toLowerCase();
    const artistMatch = [artistName, `${artistName} - topic`].includes(e.channel.toLowerCase());

    if (titleMatch && artistMatch) {
      return { ...e, score: 0 };
    }

    // Boost artist and title matches
    if (artistMatch || titleMatch) {
      score *= 0.5;
    }

    // Penalize live versions and music videos
    if (
      (!trackName.includes("live") && title.includes("live")) ||
      (!trackName.includes("concert") && title.includes("concert")) ||
      (!trackName.includes("video") && title.includes("video") && !title.includes("lyric"))
    ) {
      score *= 2;
    }

    // Penalize duration mismatch
    score += Math.abs(track.durationMs - e.durationMs) / 30_000;

    return { ...e, score };
  });

  return {
    success: true,
    value: scoredVideos,
  };
}

export async function sourceFromTrack(track: TrackMetadata): Promise<Result<string>> {
  const result = await getVideos(track, 5);

  if (!result.success) {
    return {
      success: false,
      error: `Failed to fetch video: ${result.error}`,
    };
  }

  if (result.value.length == 0) {
    return {
      success: false,
      error: "No matches found",
    };
  }

  // Find perfect match
  const perfectMatch = result.value.find((e) => e.score == 0);

  if (perfectMatch) {
    return {
      success: true,
      value: `https://youtube.com/watch?v=${perfectMatch.id}`,
    };
  }

  const bestMatch = result.value.reduce((best, e) => (e.score < best.score ? e : best));

  return {
    success: true,
    value: `https://youtube.com/watch?v=${bestMatch.id}`,
  };
}

// Download songs
export async function downloadSong(song: Song): Promise<Result<string>> {
  if (!song.youtubeSource) {
    return {
      success: false,
      error: "Song doesn't have a YouTube source",
    };
  }

  const outputPath = path.join(
    MUSIC_PATH,
    sanitize(song.artist),
    sanitize(song.album),
    `${song.trackNumber}. ${sanitize(song.name)}`,
  );

  const process = Bun.spawn(
    [
      "yt-dlp",
      "--embed-metadata",
      "-x",
      song.youtubeSource,
      "-o",
      outputPath,
      "--print",
      "after_move:filepath",
    ],
    { stdout: "pipe", stderr: "ignore" },
  );

  const exitCode = await process.exited;
  const output = await process.stdout.text();

  if (exitCode != 0) {
    return {
      success: false,
      error: `Process exited with code ${exitCode}`,
    };
  }

  const actualPath = output.trim().split("\n").pop()!;

  return {
    success: true,
    value: actualPath,
  };
}
