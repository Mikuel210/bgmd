import type { SongWrapper } from "./library";
import { serve } from "./server";

export interface Status {
    playing: boolean,
    songWrapper?: SongWrapper
}

let status: Status = { playing: false };
let process: Bun.Subprocess | null = null;

export function play(songWrapper: SongWrapper): Response {
    const song = songWrapper.song;
    stop();

    if (song.localSource) {
        process = Bun.spawn(["mpv", song.localSource, "--aid=1"]);
    } else if (song.youtubeSource) {
        process = Bun.spawn(["mpv", song.youtubeSource, "--no-video", "--aid=1"]);
    }

    if (song.localSource || song.youtubeSource) {
        status = {
            playing: true,
            songWrapper: songWrapper
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
    if (process?.exitCode) {
        status = {
            playing: false
        };
    }

    return status;
}

serve();
