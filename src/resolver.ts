import { createSpinner, forEachConcurrent, reserveLines, type TaskResult } from "./task";
import { safeFetch } from "./connection";

const CONCURRENT_TASKS = 10;
const SEARCH_LIMIT = 5;

export interface Artist {
    id: number,
    name: string
}

export interface Album {
    id: number,
    name: string,
    artist: Artist
}

export interface Track {
    id: number,
    name: string,
    discNumber: number,
    trackNumber: number,
    album: Album
}

async function search(query: string, limit: number, entity: string, wrapperType: string): Promise<TaskResult> {
    const result = await safeFetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=${limit}`);
    const json = await result.json() as Record<string, any>;

    if (!result.ok) {
        return {
            success: false,
            error: json.error
        };
    }

    let response: Record<string, any>[] = json.results;

    response = response
        .filter(e => e.wrapperType == wrapperType)
        .slice(0, limit);

    return {
        success: true,
        value: response
    };
}

export async function searchArtists(query: string, limit: number = SEARCH_LIMIT): Promise<TaskResult> {
    const result = await search(query, limit, "musicArtist", "artist");
    if (!result.success) return result;

    const response: Record<string, any>[] = result.value;

    const artists: Artist[] = response
        .map(e => {
            return {
                id: e.artistId,
                name: e.artistName
            }
        }
    );

    return {
        success: true,
        value: artists
    }
}

export async function searchAlbums(query: string, limit: number = SEARCH_LIMIT): Promise<TaskResult> {
    const result = await search(query, limit, "album", "collection");
    if (!result.success) return result;

    const response: Record<string, any>[] = result.value;

    const albums: Album[] = response
        .map(e => {
            return {
                id: e.collectionId,
                name: e.collectionName,
                artist: {
                    id: e.artistId,
                    name: e.artistName
                }
            }
        }
    );

    return {
        success: true,
        value: albums
    }
}

export async function searchTracks(query: string, limit: number = SEARCH_LIMIT): Promise<TaskResult> {
    const result = await search(query, limit, "musicTrack", "track");
    if (!result.success) return result;

    const response: Record<string, any>[] = result.value;

    const tracks: Track[] = response
        .map(e => {
            return {
                id: e.trackId,
                name: e.trackName,
                discNumber: e.discNumber,
                trackNumber: e.trackNumber,
                album: {
                    id: e.collectionId,
                    name: e.collectionName,
                    artist: {
                        id: e.artistId,
                        name: e.artistName
                    }
                }
            }
        }
    );

    return {
        success: true,
        value: tracks
    }
}

export async function sourceFromTrack(track: Track): Promise<TaskResult> {
    const url = `https://music.youtube.com/search?q=${encodeURIComponent(track.album.artist.name)}+-+${encodeURIComponent(track.name)}]`;
    const process = Bun.spawn(["yt-dlp", "-I", "1", url, "--get-id"], { stderr: "ignore" });

    const exitCode = await process.exited;

    if (exitCode != 0) {
        return {
            success: false,
            error: `Process exited with code ${exitCode}`
        };
    }

    const videoId = (await process.stdout.text()).trim();

    return {
        success: true,
        value: `https://youtube.com/watch?v=${videoId}`
    };
}

export async function tracksFromAlbum(album: Album): Promise<TaskResult> {
    const result = await fetch(`https://itunes.apple.com/lookup?id=${album.id}&entity=song`);
    const json = await result.json() as Record<string, any>;

    if (!result.ok) {
        return {
            success: false,
            error: json.error
        };
    }

    const response: Record<string, any>[] = json.results;

    const tracks: Track[] = response
        .filter(e =>
            e.wrapperType == "track" &&
            e.artistName == album.artist.name
        )
        .map(e => {
            return {
                id: e.trackId,
                name: e.trackName,
                discNumber: e.discNumber,
                trackNumber: e.trackNumber,
                album: {
                    id: e.collectionId,
                    name: e.collectionName,
                    artist: {
                        id: e.artistId,
                        name: e.artistName
                    }
                }
            };
        }
    );

    return {
        success: true,
        value: tracks
    };
}

async function albumsFromArtist(artist: Artist): Promise<TaskResult> {
    const result = await fetch(`https://itunes.apple.com/lookup?id=${artist.id}&entity=album`);
    const json = await result.json() as Record<string, any>;

    if (!result.ok) {
        return {
            success: false,
            error: json.error
        };
    }

    const response: Record<string, any>[] = json.results;

    const albums: Album[] = response
        .filter(e =>
            e.wrapperType == "collection" &&
            e.artistName == artist.name
        )
        .map(e => {
            return {
                id: e.collectionId,
                name: e.collectionName,
                artist: {
                    id: e.artistId,
                    name: e.artistName
                }
            };
        }
    );

    return {
        success: true,
        value: albums
    };
}

export async function tracksFromArtist(artist: Artist): Promise<TaskResult> {
    // Fetch albums
    reserveLines(1);
    const spinner = createSpinner("Fetching albums...", 0);
    const albumsResult = await albumsFromArtist(artist);

    if (!albumsResult.success) return albumsResult;
    spinner.succeed("Albums fetched");

    const albums = albumsResult.value as Album[];
    const tracks: Track[] = [];

    // Fetch tracks
    reserveLines(Math.min(CONCURRENT_TASKS, albums.length));

    await forEachConcurrent(albums, CONCURRENT_TASKS, async (album, index) => {
        const spinner = createSpinner(`Fetching tracks from album: ${album.name}`, index);
        const tracksResult = await tracksFromAlbum(album);

        if (!tracksResult.success) {
            spinner.fail(`Failed to fetch tracks from album: ${tracksResult.error}`);
            return;
        }

        const albumTracks = tracksResult.value as Track[];
        tracks.push(...albumTracks);

        spinner.succeed(`Fetched tracks from album: ${album.name}`);
    });

    return {
        success: true,
        value: tracks
    };
}
