import type { Song } from "./daemon/library";
import { HOME_PATH } from "./store";
import type { TaskResult } from "./task";
import path from "node:path";

const MUSIC_PATH = path.join(HOME_PATH, "Music");
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

export async function downloadSong(song: Song): Promise<TaskResult> {
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
