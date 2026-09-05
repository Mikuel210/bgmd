import { type Album, type Artist, type Entity, type Song } from "../../core/library";
import type { Result } from "../../core/task";
import { get_libraryAlbums, get_libraryArtists, get_librarySongs, get_librarySongsId } from "../connection";
import { fuzzySearch, promptOptions, stringifyAlbum, stringifyArtist, stringifySong } from "../formatter";

const HTTP_PREFIXES = ["https://www.", "https://", "http://www.", "http://"];
const YOUTUBE_PREFIXES = ["youtube.com/watch?v=", "youtu.be/"];

// General
export const validateSwitch = (_: string): Promise<Result> => Promise.resolve({ success: true, value: undefined });

export async function validateString(input: string): Promise<Result<string>> {
    return {
        success: true,
        value: input
    };
}

export async function validatePositiveInteger(input: string): Promise<Result<number>> {
    if (input.trim() === '') {
        return {
            success: false,
            error: "Value can't be empty"
        };
    }

    const number = Number(input);

    if (Number.isNaN(number)) {
        return {
            success: false,
            error: "Value must be a number"
        };
    }

    if (!Number.isInteger(number)) {
        return {
            success: false,
            error: "Value must be an integer"
        }
    }

    if (number <= 0) {
        return {
            success: false,
            error: "Value must be greater than 0"
        };
    }

    return {
        success: true,
        value: number
    };
}

type EntitySearch = Entity & {
    name: string,
    album: string,
    artist: string
};

export async function validateEntity(input: string): Promise<Result<Entity>> {
    const songResult = await get_librarySongsId(input);

    if (songResult.success) {
        return {
            success: true,
            value: {
                type: "song",
                value: songResult.value
            }
        };
    }

    // Fetch all entities
    const artistsResult = await get_libraryArtists();

    if (!artistsResult.success) {
        return {
            success: false,
            error: `Failed to fetch artists: ${artistsResult.error}`
        };
    }

    // Search for query
    const artists = artistsResult.value;
    const albums = artists.map(e => e.albums).flat();
    const songs = albums.map(e => e.songs).flat();

    const entities: EntitySearch[] = [
        songs.map((e): EntitySearch => {
            return {
                type: "song",
                name: e.name,
                album: e.album,
                artist: e.artist,
                value: e
            };
        }),
        albums.map((e): EntitySearch => {
            return {
                type: "album",
                name: e.name,
                album: e.name,
                artist: e.artist,
                value: e
            };
        }),
        artists.map((e): EntitySearch => {
            return {
                type: "artist",
                name: e.name,
                album: e.name,
                artist: e.name,
                value: e
            };
        })
    ].flat();

    const searchOptions = fuzzySearch(entities, ['name', 'album', 'artist'], input, 5);

    const matchResult = await promptOptions<EntitySearch>(
        searchOptions,
        input,
        (e) => {
            switch (e.type) {
                case "song":
                    return stringifySong(e.value);
                case "album":
                    return stringifyAlbum(e.value);
                default:
                    return stringifyArtist(e.value);
            }
        },
        "an item"
    );

    if (!matchResult.success) return matchResult;

    return {
        success: true,
        value: matchResult.value
    }
}

// Songs
export async function validateSong(input: string): Promise<Result<Song>> {
    const songResult = await get_librarySongsId(input);
    if (songResult.success) return songResult;

    // Search for query
    const songsResult = await get_librarySongs();

    if (!songsResult.success) {
        return {
            success: false,
            error: `Failed to fetch library: ${songsResult.error}`
        };
    }

    const searchOptions = fuzzySearch(songsResult.value, ['name', 'album', 'artist'], input, 5);

    const matchResult = await promptOptions(
        searchOptions,
        input,
        stringifySong,
        "a song"
    );

    if (!matchResult.success) return matchResult;

    return {
        success: true,
        value: matchResult.value
    }
}

export async function validateLocalSource(input: string): Promise<Result<string>> {
    const file = Bun.file(input);

    if (await file.exists()) {
        if (file.type.startsWith("audio")) {
            return {
                success: true,
                value: input
            };
        }

        return {
            success: false,
            error: "Path must be an audio file"
        }
    }

    return {
        success: false,
        error: "Path not found"
    }
}

function cleanYouTubeUrl(input: string): string | null {
    let isYouTubeUrl = false;
    let videoId = input;

    // Remove HTTP and YouTube prefixes
    for (const prefix of HTTP_PREFIXES) {
        if (!videoId.startsWith(prefix)) continue;
        videoId = videoId.slice(prefix.length);
    }

    for (const prefix of YOUTUBE_PREFIXES) {
        if (!videoId.startsWith(prefix)) continue;

        videoId = videoId.slice(prefix.length);
        isYouTubeUrl = true;
    }

    // Remove additional search parameters
    const index1 = videoId.indexOf('?');
    const index2 = videoId.indexOf('&')
    if (index1 != -1) videoId = videoId.substring(0, index1);
    if (index2 != -1) videoId = videoId.substring(0, index2);

    // Return clean URL
    if (videoId != input && isYouTubeUrl)
        return `https://youtube.com/watch?v=${videoId}`;

    return null;
}

export async function validateYouTubeSource(input: string): Promise<Result<string>> {
    const url = cleanYouTubeUrl(input);

    if (url) {
        return {
            success: true,
            value: url
        };
    }

    return {
        success: false,
        error: "YouTube video not found"
    };
}

// Albums
export async function validateAlbum(input: string): Promise<Result<Album>> {
    const albumsResult = await get_libraryAlbums();

    if (!albumsResult.success) {
        return {
            success: false,
            error: `Failed to fetch albums: ${albumsResult.error}`
        };
    }

    // Search for query
    const searchOptions = fuzzySearch(albumsResult.value, ['name', 'artist'], input, 5);

    const matchResult = await promptOptions(
        searchOptions,
        input,
        stringifyAlbum,
        "an album"
    );

    if (!matchResult.success) return matchResult;

    return {
        success: true,
        value: matchResult.value
    }
}

// Artists
export async function validateArtist(input: string): Promise<Result<Artist>> {
    const artistsResult = await get_libraryArtists();

    if (!artistsResult.success) {
        return {
            success: false,
            error: `Failed to fetch artists: ${artistsResult.error}`
        };
    }

    // Search for query
    const searchOptions = fuzzySearch(artistsResult.value, ['name'], input, 5);

    const matchResult = await promptOptions(
        searchOptions,
        input,
        stringifyArtist,
        "an artist"
    );

    if (!matchResult.success) return matchResult;

    return {
        success: true,
        value: matchResult.value
    }
}
