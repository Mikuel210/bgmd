import { styleText } from "node:util";
import { get_library, post_librarySongs, put_librarySongs } from "./connection";
import type { Library, Song } from "./daemon/library";
import { sourceFromTrack, type Track } from "./resolver";
import { forEachConcurrent, type TaskResult } from "./task";

export function stringifySong(id: string, song: Song): string {
    return `[${id}] ${song.artist} - ${song.name} (${song.album})`;
}

export function getSongId(library: Library, song: Song): string {
    return Object.keys(library.songs).filter(e => library.songs[e] == song)[0]!;
}

function isValidTrackNumber(songs: Song[], song: Song): boolean {
    return !songs.some(e =>
        e.artist == song.artist &&
        e.album == song.album &&
        e.discNumber == song.discNumber &&
        e.trackNumber == song.trackNumber
    );
}

export async function addSong(song: Song, explicitTrackNumber: boolean): Promise<TaskResult> {
    // Validate track number
    const libraryResult = await get_library();
    const libraryJson = await libraryResult.json() as Record<string, any>;

    if (!libraryResult.ok) {
        return {
            success: false,
            error: `Failed to fetch library: ${libraryJson.error}`
        };
    }

    const library = libraryJson as Library;
    const songs = Object.values(library.songs);

    if (!isValidTrackNumber(songs, song)) {
        if (explicitTrackNumber) {
            return {
                success: false,
                error: `Track number already exists in disc`
            };
        }

        // Pick next valid track number
        const discSongs = Object.values(library.songs).filter(e =>
            e.artist == song.artist &&
            e.album == song.album &&
            e.discNumber == song.discNumber
        ).sort((a, b) => a.trackNumber - b.trackNumber);

        let lastTrackNumber = 0;

        for (const discSong of discSongs) {
            if (discSong.trackNumber == lastTrackNumber + 1) {
                lastTrackNumber++;
                continue;
            }

            break;
        }

        song.trackNumber = lastTrackNumber + 1;
    }

    // Add song
    const addResult = await post_librarySongs(song);
    const addJson = await addResult.json() as Record<string, any>;

    if (!addResult.ok) {
        return {
            success: false,
            error: `Failed to add song: ${addJson.error}`
        };
    }

    return {
        success: true,
        value: addJson
    }
}

export async function editSong(id: string, song: Song): Promise<TaskResult> {
    // Validate track number
    const libraryResult = await get_library();
    const libraryJson = await libraryResult.json() as Record<string, any>;

    if (!libraryResult.ok) {
        return {
            success: false,
            error: `Failed to fetch library: ${libraryJson.error}`
        };
    }

    const library = libraryJson as Library;
    const songs = Object.values(library.songs).filter(e => getSongId(library, e) != id);

    if (!isValidTrackNumber(songs, song)) {
        return {
            success: false,
            error: `A song with the same track number is already in the disc`
        };
    }

    // Save changes
    const editResult = await put_librarySongs(id, song);

    if (!editResult.ok) {
        const editJson = await editResult.json() as Record<string, any>;

        return {
            success: false,
            error: `Failed to edit song: ${editJson.error}`
        };
    }

    return {
        success: true
    };
}

export async function captureTrack(track: Track): Promise<TaskResult> {
    const sourceResult = await sourceFromTrack(track);
    if (!sourceResult.success) return sourceResult;

    const url = sourceResult.value as string;

    const song: Song = {
        name: track.name,
        album: track.album.name,
        artist: track.album.artist.name,
        discNumber: track.discNumber,
        trackNumber: track.trackNumber,
        youtubeSource: url,
        state: 0,
        mood: {},
        tags: []
    };

    const addResult = await addSong(song, true);
    if (!addResult.success) return addResult;

    const addJson = addResult.value as Record<string, any>;

    return {
        success: true,
        value: addJson
    };
}

interface Name {
    name: string
}

export async function capture<T extends Name>(
    query: string,
    search: (query: string) => Promise<TaskResult>,
    promptName: string,
    stringify: (entry: T) => string,
    getTracks: (entry: T) => Promise<TaskResult>)
    : Promise<number>
{
    const searchResult = await search(query);

    if (!searchResult.success) {
        console.error(searchResult.error);
        return 1;
    }

    const entries = searchResult.value as T[];

    // Check for exact match
    let entry = entries.find(e => e.name.toLowerCase().trim() == query.toLowerCase().trim());

    if (!entry) {
        // Prompt options
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]!;
            console.log(`${i + 1}. ${stringify(entry)}`);
        }

        const range = `(1 - ${entries.length})`;
        const input = prompt(`\nSelect ${promptName} to add ${range}:`) ?? "";
        let number;

        try {
            number = parseInt(input);
        } catch (e) {
            console.error(`Value must be a number ${range}`);
            return 1;
        }

        // Validate range
        if (number < 1) {
            console.error("Value must be greater than 0");
            return 1;
        }

        if (number > entries.length) {
            console.error(`Value must be lower than ${entries.length + 1}`);
            return 1;
        }

        entry = entries[number - 1]!;
    } else {
        console.log(`Exact match found: ${stringify(entry)}`);
    }

    // Fetch tracks
    const tracksResult = await getTracks(entry);

    if (!tracksResult.success) {
        console.error(tracksResult.error);
        return 1;
    }

    const tracks = tracksResult.value as Track[];

    // Capture songs
    await forEachConcurrent(tracks, async (track) => {
        console.log(`Capturing song: ${track.name}`);
        const captureResult = await captureTrack(track);

        if (!captureResult.success) {
            console.error(`${captureResult.error}: ${track.name}`);
            return;
        }

        const captureJson = captureResult.value as Record<string, any>;
        console.log(styleText("green", `Song captured: ${stringifySong(captureJson.id, captureJson.song)}`));
    });

    return 0;
}
