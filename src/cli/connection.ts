import type { Library, Song, SongData, Status } from "../core/library";
import type { Result } from "../core/task";

const DAEMON_URL = "http://127.0.0.1:8686/";

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

export async function get_play(id: string): Promise<Result<Status>> {
    return await fetchResult(DAEMON_URL + `play/${id}`);
}

export async function get_stop(): Promise<Result<Status>> {
    return await fetchResult(DAEMON_URL + "stop");
}

export async function get_status(): Promise<Result<Status>> {
    return await fetchResult(DAEMON_URL + "status");
}

export async function get_library(): Promise<Result<Library>> {
    return await fetchResult(DAEMON_URL + "library");
}

export async function get_librarySongs(id: string): Promise<Result<Song>> {
    return await fetchResult(DAEMON_URL + `library/songs/${id}`);
}

export async function post_librarySongs(data: SongData): Promise<Result<Song>> {
    return await fetchResult(DAEMON_URL + "library/songs", {
        method: "POST",
        body: JSON.stringify(data),
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

export async function delete_librarySongs(id: string): Promise<Result<Song>> {
    return await fetchResult(DAEMON_URL + `library/songs/${id}`, {
        method: "DELETE"
    });
}
