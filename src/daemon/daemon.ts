import type { Song } from "./library";
import { serve } from "./server";

let currentSong: Song | null = null;
let currentProcess: Bun.Subprocess | null = null;

export function play(song: Song): Response {
    stop();

    if (song.localSource) {
        currentProcess = Bun.spawn(["mpv", song.localSource, "--aid=1"]);
    } else if (song.youtubeSource) {
        currentProcess = Bun.spawn(["mpv", song.youtubeSource, "--no-video", "--aid=1"]);
    }

    if (song.localSource || song.youtubeSource) {
        currentSong = song;
        return Response.json({ playing: true, song }, { status: 200 });
    }

    return Response.json({ error: "No source available" }, { status: 500 });
}

export function stop(): void {
    if (!currentProcess) return;

    currentProcess.kill();
    currentSong = null;
}

serve();
