import type { Song } from "./daemon/library"
const daemonUrl = "http://127.0.0.1:8686/"

export async function get_library(): Promise<Response> {
    return await fetch(daemonUrl + "library");
}

export async function post_librarySongs(song: Song): Promise<Response> {
    return await fetch(daemonUrl + "library/songs", {
        method: "POST",
        body: JSON.stringify(song)
    });
}
