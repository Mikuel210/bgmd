import type { Song, SongData } from "../core/library";
import type { Result } from "../core/task";
import { get_library, post_librarySongs, put_librarySongs } from "./connection";

export function stringifySong(song: Song): string {
    return `[${song.id}] ${song.artist} - ${song.name} (${song.album})`;
}

function isValidTrackNumber<T extends SongData>(songs: Song[], song: T): boolean {
    return !songs.some(e =>
        e.artist == song.artist &&
        e.album == song.album &&
        e.discNumber == song.discNumber &&
        e.trackNumber == song.trackNumber
    );
}

export async function addSong(data: SongData, explicitTrackNumber: boolean): Promise<Result<Song>> {
    // Validate track number
    const libraryResult = await get_library();

    if (!libraryResult.success) {
        return {
            success: false,
            error: `Failed to fetch library: ${libraryResult.error}`
        };
    }

    const songs: Song[] = libraryResult.value.songs;

    if (!isValidTrackNumber(songs, data)) {
        if (explicitTrackNumber) {
            return {
                success: false,
                error: `Track number already exists in disc`
            };
        }

        // Pick next valid track number
        const discSongs = songs.filter(e =>
            e.artist == data.artist &&
            e.album == data.album &&
            e.discNumber == data.discNumber
        ).sort((a, b) => a.trackNumber - b.trackNumber);

        let lastTrackNumber = 0;

        for (const discSong of discSongs) {
            if (discSong.trackNumber == lastTrackNumber + 1) {
                lastTrackNumber++;
                continue;
            }

            break;
        }

        data.trackNumber = lastTrackNumber + 1;
    }

    // Add song
    const addResult = await post_librarySongs(data);

    if (!addResult.success) {
        return {
            success: false,
            error: `Failed to add song: ${addResult.error}`
        };
    }

    return addResult;
}

export async function editSong(song: Song): Promise<Result> {
    // Validate track number
    const libraryResult = await get_library();

    if (!libraryResult.success) {
        return {
            success: false,
            error: `Failed to fetch library: ${libraryResult.error}`
        };
    }

    const songs: Song[] = libraryResult.value.songs.filter(e => e.id != song.id);

    if (!isValidTrackNumber(songs, song)) {
        return {
            success: false,
            error: `A song with the same track number is already in the disc`
        };
    }

    // Save changes
    const editResult = await put_librarySongs(song);

    if (!editResult.success) {
        return {
            success: false,
            error: `Failed to edit song: ${editResult.error}`
        };
    }

    return {
        success: true,
        value: undefined
    };
}
