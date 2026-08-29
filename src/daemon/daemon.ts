import type { Song } from "./library";
import { serve } from "./server";

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

const json = await (await fetch("https://itunes.apple.com/search?term=bleachers&entity=musicArtist&limit=5")).json() as Record<string, any>;
const artistName = json.results[0].artistName as string;
const artistId = json.results[0].artistId as number;
const json1 = await (await fetch(`https://itunes.apple.com/lookup?id=${artistId}&entity=song`)).json() as Record<string, any>;
const apiSongs: Record<string, any>[] = json1.results;

const songs: Song[] = apiSongs
    .filter(e =>
        e.wrapperType == "track" &&
        e.artistName == artistName
    )
    .map(e => {
        return {
            name: e.trackName,
            album: e.collectionName,
            artist: e.artistName,
            discNumber: e.discNumber,
            trackNumber: e.trackNumber,
            state: 0,
            mood: {},
            tags: []
        };
    }
);

console.log(songs);

serve();
