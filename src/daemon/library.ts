import { LibrarySchema, type Album, type Library, type Song, type SongData } from "../core/library";
import type { Result } from "../core/task";
import { load, save } from "../core/store";

const LIBRARY_FILENAME = "library.json"
let queue: Promise<unknown> = Promise.resolve();

function withLibrary<T>(predicate: (library: Library) => Promise<Result<T>>): Promise<Result<T>> {
    const next = queue.then(async (): Promise<Result<T>> => {
        // Load library
        const loadResult = await load<Library>(LIBRARY_FILENAME, LibrarySchema);

        if (!loadResult.success) {
            return {
                success: false,
                error: `Failed to load library: ${loadResult.error}`
            };
        }

        const library = loadResult.value;

        // Run operation
        const operationResult = await predicate(library);
        if (!operationResult.success) return operationResult;

        // Save library
        const saveResult = await save(LIBRARY_FILENAME, library);

        if (!saveResult.success) {
            return {
                success: false,
                error: `Failed to save library: ${saveResult.error}`
            };
        }

        return operationResult;
    });

    queue = next;
    return next;
}

export function getLibrary(): Promise<Result<Library>> {
    return withLibrary(async (library) => {
        return {
            success: true,
            value: library
        }
    });
}

// Song management
export function getSong(id: string): Promise<Result<Song>> {
    return withLibrary(async (library) => {
        const song = library.songs.find(e => e.id == id);

        if (song) {
            return {
                success: true,
                value: song
            };
        }

        return {
            success: false,
            error: "Song not found"
        };
    });
}

function isValidTrackNumber<T extends SongData>(songs: Song[], song: T): boolean {
    return !songs.some(e =>
        e.artist == song.artist &&
        e.album == song.album &&
        e.discNumber == song.discNumber &&
        e.trackNumber == song.trackNumber
    );
}

export function addSong(data: SongData, explicitTrackNumber: boolean): Promise<Result<Song>> {
    return withLibrary(async (library) => {
        if (!isValidTrackNumber(library.songs, data)) {
            if (explicitTrackNumber) {
                return {
                    success: false,
                    error: `Track number already exists in disc`
                };
            }

            // Pick next valid track number
            const discSongs = library.songs.filter(e =>
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
        let id = crypto.randomUUID().split('-')[0]!;

        while (library.songs.find(e => e.id == id))
            id = crypto.randomUUID().split('-')[0]!;

        const song: Song = { id, ...data };
        library.songs.push(song);

        return {
            success: true,
            value: song
        };
    });
}

export function editSong(song: Song): Promise<Result<Song>> {
    return withLibrary(async (library) => {
        const songs: Song[] = library.songs.filter(e => e.id != song.id);

        if (!isValidTrackNumber(songs, song)) {
            return {
                success: false,
                error: `A song with the same track number is already in the disc`
            };
        }

        const songIndex = library.songs.findIndex(e => e.id == song.id);

        if (songIndex != -1) {
            library.songs = [
                ...library.songs.slice(0, songIndex),
                song,
                ...library.songs.slice(songIndex + 1)
            ];

            return {
                success: true,
                value: song
            }
        }

        return {
            success: false,
            error: "Song not found"
        }
    });
}

export function removeSong(id: string): Promise<Result<Song>> {
    return withLibrary(async (library) => {
        const songIndex = library.songs.findIndex(e => e.id == id);

        if (songIndex != -1) {
            const song = library.songs[songIndex]!;
            library.songs.splice(songIndex, 1);

            return {
                success: true,
                value: song
            };
        }

        return {
            success: false,
            error: "Song not found"
        };
    });
}

// Album management
export function getAlbums(): Promise<Result<Album[]>> {
    return withLibrary(async (library) => {
        const albums: Album[] = [];

        for (const song of library.songs) {
            const album = albums.find(e => e.name == song.album && e.artist == song.artist);

            if (!album) {
                albums.push({
                    name: song.album,
                    artist: song.artist,
                    songs: [song]
                });

                continue;
            }

            album.songs.push(song);
        }

        return {
            success: true,
            value: albums
        };
    });
}
