import type { Song } from "./daemon/library"
const DAEMON_URL = "http://127.0.0.1:8686/"

export async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
        return await fetch(url, options);
    } catch (error) {
        return Response.json(
            { error: "Connection refused" },
            { status: 503 }
        )
    }
}

export async function get_library(): Promise<Response> {
    return await safeFetch(DAEMON_URL + "library");
}

export async function get_librarySongs(id: string): Promise<Response> {
    return await safeFetch(DAEMON_URL + `library/songs/${id}`);
}

export async function post_librarySongs(song: Song): Promise<Response> {
    return await safeFetch(DAEMON_URL + "library/songs", {
        method: "POST",
        body: JSON.stringify(song)
    });
}

export async function put_librarySongs(id: string, song: Song): Promise<Response> {
    return await safeFetch(DAEMON_URL + "library/songs", {
        method: "PUT",
        body: JSON.stringify({ id, song })
    });
}

export async function delete_librarySongs(id: string): Promise<Response> {
    return await safeFetch(DAEMON_URL + `library/songs/${id}`, {
        method: "DELETE"
    });
}

export async function get_play(id: string): Promise<Response> {
    return await safeFetch(DAEMON_URL + `play/${id}`);
}

export async function get_stop(): Promise<Response> {
    return await safeFetch(DAEMON_URL + "stop");
}
