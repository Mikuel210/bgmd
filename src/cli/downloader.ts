import type { Result } from "../core/task";
import type { Song } from "../core/library";
import type { TrackMetadata } from "./resolver";
import { MUSIC_PATH } from "../core/config";
import path from "node:path";

// Sanitize filenames
const ILLEGAL = /[\/\?<>\\:\*\|":]/g;
const CONTROL = /[\x00-\x1f\x80-\x9f]/g;
const RESERVED = /^\.+$/;
const WINDOWS = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
const REPLACEMENT = '_';

function sanitize(input: string): string {
    return input
        .replace(ILLEGAL, REPLACEMENT)
        .replace(CONTROL, REPLACEMENT)
        .replace(RESERVED, REPLACEMENT)
        .replace(WINDOWS, REPLACEMENT);
}

// Get track source
export async function sourceFromTrack(track: TrackMetadata): Promise<Result<string>> {
    const url = `https://music.youtube.com/search?q=${encodeURIComponent(track.album.artist.name)}+-+${encodeURIComponent(track.name)}`;
    const process = Bun.spawn(["yt-dlp", "-I", "1", url, "--get-id"], { stderr: "ignore" });

    const exitCode = await process.exited;

    if (exitCode != 0) {
        return {
            success: false,
            error: `Process exited with code ${exitCode}`
        };
    }

    const videoId = (await process.stdout.text()).trim();

    return {
        success: true,
        value: `https://youtube.com/watch?v=${videoId}`
    };
}

// Download songs
export async function downloadSong(song: Song): Promise<Result<string>> {
    if (!song.youtubeSource) {
        return {
            success: false,
            error: "Song doesn't have a YouTube source"
        };
    }

    const outputPath = path.join(MUSIC_PATH, sanitize(song.artist), sanitize(song.album), `${song.trackNumber}. ${sanitize(song.name)}`);

    const process = Bun.spawn(
        ["yt-dlp", "-x", song.youtubeSource, "-o", outputPath, "--print", "after_move:filepath"],
        { stdout: "pipe", stderr: "ignore" }
    );

    const exitCode = await process.exited;
    const output = await process.stdout.text();

    if (exitCode != 0) {
        return {
            success: false,
            error: `Process exited with code ${exitCode}`
        };
    }

    const actualPath = output.trim().split("\n").pop()!;

    return {
        success: true,
        value: actualPath
    };
}
