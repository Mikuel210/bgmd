import type { Song } from "./daemon/library"
const daemonUrl = "http://127.0.0.1:8686/"

async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
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
    return await safeFetch(daemonUrl + "library");
}

export async function get_librarySongs(id: string): Promise<Response> {
    return await safeFetch(daemonUrl + `library/songs/${id}`);
}

export async function post_librarySongs(song: Song): Promise<Response> {
    return await safeFetch(daemonUrl + "library/songs", {
        method: "POST",
        body: JSON.stringify(song)
    });
}

export async function delete_librarySongs(id: string): Promise<Response> {
    return await safeFetch(daemonUrl + `library/songs/${id}`, {
        method: "DELETE"
    });
}
