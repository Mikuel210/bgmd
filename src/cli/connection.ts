import type { Album, AlbumData, Artist, ArtistData, Library, Song, SongData, Status } from "../core/library";
import type { Result } from "../core/task";
import { PORT } from "../core/config";

const DAEMON_URL = `http://127.0.0.1:${PORT}/`;

export async function fetchResult<T>(url: string, options: RequestInit = {}): Promise<Result<T>> {
    try {
        const result = await fetch(url, options);
        const json = await result.json() as Record<string, any>;

        if (!result.ok) {
            return {
                success: false,
                error: json.error
            };
        }

        return {
            success: true,
            value: json as T
        };
    } catch (error) {
        return {
            success: false,
            error: "Connection refused"
        }
    }
}

// Playback
export async function get_playback(): Promise<Result<Status>> {
    return await fetchResult(DAEMON_URL + "playback");
}

export async function post_playback(id: string): Promise<Result<Status>> {
    return await fetchResult(DAEMON_URL + "playback", {
        method: "POST",
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" }
    });
}

export async function delete_playback(): Promise<Result<Status>> {
    return await fetchResult(DAEMON_URL + "playback", {
        method: "DELETE"
    });
}

// Songs
export async function get_librarySongs(): Promise<Result<Song[]>> {
    return await fetchResult(DAEMON_URL + "library/songs");
}

export async function get_librarySongsId(id: string): Promise<Result<Song>> {
    return await fetchResult(DAEMON_URL + `library/songs/${id}`);
}

export async function post_librarySongs(data: SongData, explicitTrackNumber: boolean): Promise<Result<Song>> {
    return await fetchResult(DAEMON_URL + "library/songs", {
        method: "POST",
        body: JSON.stringify({ data, explicitTrackNumber }),
        headers: { "Content-Type": "application/json" }
    });
}

export async function put_librarySongs(song: Song): Promise<Result<Song>> {
    return await fetchResult(DAEMON_URL + "library/songs", {
        method: "PUT",
        body: JSON.stringify(song),
        headers: { "Content-Type": "application/json" }
    });
}

export async function delete_librarySongsId(id: string): Promise<Result<Song>> {
    return await fetchResult(DAEMON_URL + `library/songs/${id}`, {
        method: "DELETE"
    });
}

// Albums
export async function get_libraryAlbums(): Promise<Result<Album[]>> {
    return await fetchResult(DAEMON_URL + "library/albums");
}

export async function put_libraryAlbums(oldData: AlbumData, newData: AlbumData): Promise<Result<Album>> {
    return await fetchResult(DAEMON_URL + "library/albums", {
        method: "PUT",
        body: JSON.stringify({ oldData, newData }),
        headers: { "Content-type": "application/json" }
    });
}

export async function delete_libraryAlbums(data: AlbumData): Promise<Result<Album>> {
    return await fetchResult(DAEMON_URL + "library/albums", {
        method: "DELETE",
        body: JSON.stringify(data),
        headers: { "Content-type": "application/json" }
    });
}

// Artists
export async function get_libraryArtists(): Promise<Result<Artist[]>> {
    return await fetchResult(DAEMON_URL + "library/artists");
}

export async function put_libraryArtists(oldData: ArtistData, newData: ArtistData): Promise<Result<Artist>> {
    return await fetchResult(DAEMON_URL + "library/artists", {
        method: "PUT",
        body: JSON.stringify({ oldData, newData }),
        headers: { "Content-type": "application/json" }
    });
}

export async function delete_libraryArtists(data: ArtistData): Promise<Result<Artist>> {
    return fetchResult(DAEMON_URL + "library/artists", {
        method: "DELETE",
        body: JSON.stringify(data),
        headers: { "Content-type": "application/json" }
    });
}
