import { get_library, post_librarySongs, put_librarySongs } from "./connection";
import type { Library, Song } from "./daemon/library";
import { sourceFromTrack, type Track } from "./resolver";
import type { TaskResult } from "./task";

function getId(library: Library, song: Song): string {
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
    const songs = Object.values(library.songs).filter(e => getId(library, e) != id);

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
    const url = await sourceFromTrack(track);

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
