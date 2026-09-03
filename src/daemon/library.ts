import { LibrarySchema, type Album, type AlbumData, type Artist, type ArtistData, type Library, type Song, type SongData } from "../core/library";
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

// Song management
export function getSongs(): Promise<Result<Song[]>> {
    return withLibrary(async (library) => {
        return {
            success: true,
            value: library.songs
        }
    });
}

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

            if (album) {
                album.songs.push(song);
                continue;
            }

            albums.push({
                name: song.album,
                artist: song.artist,
                songs: [song]
            });
        }

        for (const album of albums)
            album.songs.sort((a, b) => a.trackNumber - b.trackNumber);

        return {
            success: true,
            value: albums
        };
    });
}

export async function editAlbum(oldData: AlbumData, newData: AlbumData): Promise<Result<Album>> {
    const albumsResult = await getAlbums();

    return withLibrary(async (library) => {
        if (!albumsResult.success) return albumsResult;

        // Find match
        const match = albumsResult.value.find(e => e.name == oldData.name && e.artist == oldData.artist);

        if (!match) {
            return {
                success: false,
                error: "Album not found"
            };
        }

        if (oldData.name == newData.name && oldData.artist == newData.artist) {
            return {
                success: true,
                value: match
            };
        }

        // Find collision
        const collision = albumsResult.value.find(e => e.name == newData.name && e.artist == newData.artist);

        if (collision) {
            return {
                success: false,
                error: "An album with the same name and artist already exists"
            };
        }

        // Edit songs
        const ids = match.songs.map(e => e.id);
        const songs = library.songs.filter(e => ids.includes(e.id));

        for (const song of songs) {
            song.album = newData.name;
            song.artist = newData.artist;
        }

        return {
            success: true,
            value: { ...newData, songs }
        };
    });
}

export async function removeAlbum(data: AlbumData): Promise<Result<Album>> {
    const albumsResult = await getAlbums();

    return withLibrary(async (library) => {
        if (!albumsResult.success) return albumsResult;

        // Find match
        const match = albumsResult.value.find(e => e.name == data.name && e.artist == data.artist);

        if (!match) {
            return {
                success: false,
                error: "Album not found"
            };
        }

        // Delete songs
        const ids = match.songs.map(e => e.id);
        const songs = library.songs.filter(e => ids.includes(e.id));

        for (const song of songs) {
            const index = library.songs.indexOf(song);
            library.songs.splice(index, 1);
        }

        return {
            success: true,
            value: match
        };
    });
}

// Artist management
export async function getArtists(): Promise<Result<Artist[]>> {
    const albumsResult = await getAlbums();
    if (!albumsResult.success) return albumsResult;

    const artists: Artist[] = [];

    for (const album of albumsResult.value) {
        const artist = artists.find(e => e.name == album.artist);

        if (artist) {
            artist.albums.push(album);
            continue;
        }

        artists.push({
            name: album.artist,
            albums: [album]
        });
    }

    return {
        success: true,
        value: artists
    };
}

export async function editArtist(oldData: ArtistData, newData: ArtistData): Promise<Result<Artist>> {
    const artistsResult = await getArtists();

    return withLibrary(async (library) => {
        if (!artistsResult.success) return artistsResult;

        // Find match
        const match = artistsResult.value.find(e => e.name == oldData.name);

        if (!match) {
            return {
                success: false,
                error: "Artist not found"
            };
        }

        if (oldData.name == newData.name) {
            return {
                success: true,
                value: match
            };
        }

        // Find collision
        const collision = artistsResult.value.find(e => e.name == newData.name);

        if (collision) {
            return {
                success: false,
                error: "An artist with the same name already exists"
            };
        }

        // Edit albums
        const albums = match.albums;

        for (const album of albums) {
            album.artist = newData.name;

            for (const song of album.songs)
                song.artist = newData.name;
        }

        // Edit songs
        const albumSongs = match.albums.map(e => e.songs);
        const ids = albumSongs.flat().map(e => e.id);
        const songs = library.songs.filter(e => ids.includes(e.id));

        for (const song of songs)
            song.artist = newData.name;

        return {
            success: true,
            value: { ...newData, albums }
        };
    });
}

export async function removeArtist(data: ArtistData): Promise<Result<Artist>> {
    const artistsResult = await getArtists();

    return withLibrary(async (library) => {
        if (!artistsResult.success) return artistsResult;

        // Find match
        const match = artistsResult.value.find(e => e.name == data.name);

        if (!match) {
            return {
                success: false,
                error: "Artist not found"
            };
        }

        // Delete songs
        const albumSongs = match.albums.map(e => e.songs);
        const ids = albumSongs.flat().map(e => e.id);
        const songs = library.songs.filter(e => ids.includes(e.id));

        for (const song of songs) {
            const index = library.songs.indexOf(song);
            library.songs.splice(index, 1);
        }

        return {
            success: true,
            value: match
        };
    });
}
