import type { Song, Status } from "../core/library";
import { serve } from "./server";

let status: Status = { playing: false };
let process: Bun.Subprocess | null = null;

export function play(song: Song): Response {
    stop();

    if (song.localSource) {
        process = Bun.spawn(["mpv", song.localSource, "--aid=1"]);
    } else if (song.youtubeSource) {
        process = Bun.spawn(["mpv", song.youtubeSource, "--no-video", "--aid=1"]);
    }

    if (song.localSource || song.youtubeSource) {
        status = {
            playing: true,
            song: song
        };

        return Response.json(status, { status: 200 });
    }

    return Response.json({ error: "No source available" }, { status: 500 });
}

export function stop(): void {
    if (!process) return;
    process.kill();

    status = {
        playing: false
    };
}

export function getStatus(): Status {
    if (process?.exitCode !== null) {
        status = {
            playing: false
        };
    }

    return status;
}

serve();
