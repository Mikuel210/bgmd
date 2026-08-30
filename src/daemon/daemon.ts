import type { Song } from "./library";
import { serve } from "./server";
import { tracksFromArtist } from "../resolver"

let currentSong: Song | null = null;
let currentProcess: Bun.Subprocess | null = null;

export function play(song: Song): Response {
    if (song.youtubeSource) {
        currentSong = song;
        currentProcess = Bun.spawn(["mpv", song.youtubeSource, "--no-video", "--aid=1"]);

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
