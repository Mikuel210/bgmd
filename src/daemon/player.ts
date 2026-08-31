import type { Song, Status } from "../core/library";
import type { Result } from "../core/task";

let status: Status = { playing: false };
let process: Bun.Subprocess | null = null;

export function getStatus(): Status {
    if (process?.exitCode !== null) {
        status = {
            playing: false
        };
    }

    return status;
}

export function play(song: Song): Result<Status> {
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

        return {
            success: true,
            value: status
        };
    }

    return {
        success: false,
        error: "No source available"
    };
}

export function stop(): Status {
    if (process) process.kill();

    status = {
        playing: false
    };

    return status;
}
