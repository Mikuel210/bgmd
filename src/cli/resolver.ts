import { forEachConcurrent, type Result } from "../core/task";
import { createSpinner, reserveLines } from "./formatter";
import { CONCURRENT_TASKS } from "../core/config";
import { fetchResult } from "./connection";

const SEARCH_LIMIT = 5;

export interface ArtistMetadata {
    id: number,
    name: string
}

export interface AlbumMetadata {
    id: number,
    name: string,
    artist: ArtistMetadata
}

export interface TrackMetadata {
    id: number,
    name: string,
    discNumber: number,
    trackNumber: number,
    album: AlbumMetadata
}

// Search
async function search(query: string, limit: number, entity: string, wrapperType: string): Promise<Result<Record<string, any>[]>> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=${limit}`;
    const result = await fetchResult<Record<string, any>>(url);

    if (!result.success) {
        return {
            success: false,
            error: result.error
        };
    }

    let response: Record<string, any>[] = result.value.results;

    response = response
        .filter(e => e.wrapperType == wrapperType)
        .slice(0, limit);

    return {
        success: true,
        value: response
    };
}

export async function searchArtists(query: string, limit: number = SEARCH_LIMIT): Promise<Result<ArtistMetadata[]>> {
    const result = await search(query, limit, "musicArtist", "artist");
    if (!result.success) return result;

    const artists: ArtistMetadata[] = result.value.map(e => {
        return {
            id: e.artistId,
            name: e.artistName
        };
    });

    return {
        success: true,
        value: artists
    };
}

export async function searchAlbums(query: string, limit: number = SEARCH_LIMIT): Promise<Result<AlbumMetadata[]>> {
    const result = await search(query, limit, "album", "collection");
    if (!result.success) return result;

    const albums: AlbumMetadata[] = result.value.map(e => {
        return {
            id: e.collectionId,
            name: e.collectionName,
            artist: {
                id: e.artistId,
                name: e.artistName
            }
        };
    });

    return {
        success: true,
        value: albums
    };
}

export async function searchTracks(query: string, limit: number = SEARCH_LIMIT): Promise<Result<TrackMetadata[]>> {
    const result = await search(query, limit, "musicTrack", "track");
    if (!result.success) return result;

    const tracks: TrackMetadata[] = result.value.map(e => {
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
    });

    return {
        success: true,
        value: tracks
    };
}

// Fetch tracks
export async function tracksFromAlbum(album: AlbumMetadata): Promise<Result<TrackMetadata[]>> {
    const result = await fetchResult<Record<string, any>>(`https://itunes.apple.com/lookup?id=${album.id}&entity=song`);
    if (!result.success) return result;

    const response: Record<string, any>[] = result.value.results;

    const tracks: TrackMetadata[] = response
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

async function albumsFromArtist(artist: ArtistMetadata): Promise<Result<AlbumMetadata[]>> {
    const result = await fetchResult<Record<string, any>>(`https://itunes.apple.com/lookup?id=${artist.id}&entity=album`);
    if (!result.success) return result;

    const response: Record<string, any>[] = result.value.results;

    const albums: AlbumMetadata[] = response
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

export async function tracksFromArtist(artist: ArtistMetadata): Promise<Result<TrackMetadata[]>> {
    // Fetch albums
    reserveLines(1);
    const spinner = createSpinner("Fetching albums...", 0);
    const albumsResult = await albumsFromArtist(artist);

    if (!albumsResult.success) return albumsResult;
    spinner.succeed("Albums fetched");

    const albums = albumsResult.value;
    const tracks: TrackMetadata[] = [];

    // Fetch tracks
    reserveLines(Math.min(CONCURRENT_TASKS, albums.length));

    await forEachConcurrent(albums, async (album, index) => {
        const spinner = createSpinner(`Fetching tracks from album: ${album.name}`, index);
        const tracksResult = await tracksFromAlbum(album);

        if (!tracksResult.success) {
            spinner.fail(`Failed to fetch tracks from album: ${tracksResult.error}`);
            return;
        }

        const albumTracks = tracksResult.value;
        tracks.push(...albumTracks);

        spinner.succeed(`Fetched tracks from album: ${album.name}`);
    });

    return {
        success: true,
        value: tracks
    };
}
