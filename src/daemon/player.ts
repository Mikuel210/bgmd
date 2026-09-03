import type { Entity, Song, Status } from "../core/library";
import type { Result } from "../core/task";

let status: Status = { playing: false };
let process: Bun.Subprocess | null = null;

export const getStatus = () => status;

export function songsFromEntity(entity: Entity): Song[] {
    switch (entity.type) {
        case "song":
            return [entity.value];
        case "album":
            return entity.value.songs;
        case "artist":
            return entity.value.albums.map(e => e.songs).flat();
    }
}

export function playReplace(songs: Song[]): Result<Status> {
    status = {
        playing: true,
        song: songs[0]!,
        queue: songs.slice(1)
    };

    const result = play();
    if (!result.success) return result;

    return {
        success: true,
        value: status
    };
}

export function playNext(songs: Song[]): Result<Status> {
    if (!status.playing) return playReplace(songs);

    status = {
        playing: true,
        song: status.song,
        queue: songs.concat(status.queue)
    };

    return {
        success: true,
        value: status
    };
}

export function playLast(songs: Song[]): Result<Status> {
    if (!status.playing) return playReplace(songs);

    status = {
        playing: true,
        song: status.song,
        queue: status.queue.concat(songs)
    };

    return {
        success: true,
        value: status
    };
}

function play(): Result<Status> {
    if (process) process.kill();

    if (!status.playing) {
        return {
            success: true,
            value: status
        };
    }

    const song = status.song;

    if (!song) {
        return {
            success: true,
            value: status
        };
    }

    // Spawn mpv process
    let command: string[] = [];

    if (song.localSource) {
        command = ["mpv", song.localSource, "--aid=1"];
    } else if (song.youtubeSource) {
        command = ["mpv", song.youtubeSource, "--no-video", "--aid=1"];
    } else {
        return {
            success: false,
            error: "No source available"
        };
    }

    process = Bun.spawn(command, {
        onExit(_, exitCode) {
            if (exitCode == 4) return;
            if (!status.playing) return;

            if (status.queue.length == 0) {
                status = {
                    playing: false
                };

                return;
            }

            status = {
                playing: true,
                song: status.queue[0]!,
                queue: status.queue.slice(1)
            };

            play();
        }
    })

    return {
        success: true,
        value: status
    };
}

export function stop(): Status {
    if (process) process.kill();

    status = {
        playing: false
    };

    return status;
}
