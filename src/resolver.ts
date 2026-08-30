import type { TaskResult } from "./task";
import type { Song } from "./daemon/library";
import { safeFetch } from "./connection";

const LIMIT = 5;

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
    response = response.filter(e => e.wrapperType == wrapperType);

    return {
        success: true,
        value: response
    };
}

export async function searchArtists(query: string, limit: number = LIMIT): Promise<TaskResult> {
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

export async function searchAlbums(query: string, limit: number = LIMIT): Promise<TaskResult> {
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

export async function searchTracks(query: string, limit: number = LIMIT): Promise<TaskResult> {
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

export async function sourceFromTrack(track: Track): Promise<string> {
    const url = `https://music.youtube.com/search?q=${encodeURIComponent(track.album.artist.name)}+-+${encodeURIComponent(track.name)}]`;
    const process = Bun.spawn(["yt-dlp", "-I", "1", url, "--get-id"]);

    const videoId = (await process.stdout.text()).trim();
    return `https://youtube.com/watch?v=${videoId}`;
}

export async function tracksFromArtist(artist: Artist): Promise<TaskResult> {
    const result = await fetch(`https://itunes.apple.com/lookup?id=${artist.id}&entity=song`)
    const json = await result.json() as Record<string, any>;

    if (!result.ok) {
        return {
            success: false,
            error: json.error
        };
    }

    const response: Record<string, any>[] = json.results;

    const songs: Song[] = response
        .filter(e =>
            e.wrapperType == "track" &&
            e.artistName == artist.name
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

    return {
        success: true,
        value: songs
    };
}
