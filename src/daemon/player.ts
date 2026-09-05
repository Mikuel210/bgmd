import type { Entity, Song, Status } from "../core/library";
import type { Result } from "../core/task";
import { sleep, type Socket } from "bun";

let status: Status = { playing: false };
let process: Bun.Subprocess | null = null;
let socketPath: string | null = null;
let socket: Socket | null = null;

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
        paused: false,
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
        paused: false,
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
        paused: false,
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
    socketPath = `/tmp/mpv-${crypto.randomUUID()}.sock`;

    if (song.localSource) {
        command = ["mpv", `--input-ipc-server=${socketPath}`, song.localSource, "--aid=1"];
    } else if (song.youtubeSource) {
        command = ["mpv", `--input-ipc-server=${socketPath}`, song.youtubeSource, "--no-video", "--aid=1"];
    } else {
        return {
            success: false,
            error: "No source available"
        };
    }

    process = Bun.spawn(command, {
        onExit(_, exitCode) {
            if (exitCode == 4) return;
            skip();
        }
    });

    connect(socketPath);

    return {
        success: true,
        value: status
    };
}

async function connect(path: string): Promise<void> {
    for (let i = 0; i < 50; i++) {
        try {
            socket = await Bun.connect({
                unix: path,
                socket: {
                    open(_) { },
                    data(_, chunk) { },
                    close(_) { },
                    error(_, error) { console.error(`mpv IPC error: ${error}`); },
                }
            });

            return;
        } catch {
            await sleep(20);
        }
    }
}

function send(command: any[], request_id?: number) {
    socket?.write(JSON.stringify({ command, request_id }) + '\n');
}

export function skip(): Status {
    if (!status.playing) return status;

    if (process != null)
        kill();

    if (status.queue.length == 0) {
        status = {
            playing: false
        };

        return status;
    }

    status = {
        playing: true,
        paused: false,
        song: status.queue[0]!,
        queue: status.queue.slice(1)
    };

    play();
    return status;
}

export function pause(): Status {
    if (!status.playing || status.paused || !process || !socket)
        return status;

    send(["set_property", "pause", true]);
    status.paused = true;

    return status;
}

export function resume(): Status {
    if (!status.playing || !status.paused || !process || !socket)
        return status;

    send(["set_property", "pause", false]);
    status.paused = false;

    return status;
}

export function stop(): Status {
    kill();

    status = {
        playing: false
    };

    return status;
}

function kill() {
    if (!process) return;

    process.kill();
    process = null;
    socket = null;
}
