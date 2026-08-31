import { SongDataSchema, SongSchema, type Library, type Song } from "../core/library"
import { loadLibrary, saveLibrary } from "./library"
import { getStatus, play, stop } from "./daemon"
import z from "zod"

export function serve(): void {
    const server = Bun.serve({
        port: 8686,
        error: (e) => Response.json({ error: String(e) }, { status: 500 }),
        routes: {
            "/": () => new Response("bgmd: All systems nominal"),
            "/play/:id": async (request) => {
                const id = request.params.id;
                const result = await loadLibrary();

                if (!result.success) {
                    return Response.json(
                        { error: "Corrupted library", issues: z.prettifyError(result.error) },
                        { status: 500 }
                    );
                }

                const library = result.data as Library;
                const song = library.songs.find(e => e.id == id);

                if (song) return play(song);
                return Response.json({ error: "Song not found" }, { status: 404 });
            },
            "/stop": async (request) => {
                stop();
                return Response.json({ stopped: true }, { status: 200 });
            },
            "/status": async () => Response.json(getStatus(), { status: 200 }),
            "/library": async () => {
                const result = await loadLibrary();

                if (!result.success) {
                    return Response.json(
                        { error: "Corrupted library", issues: z.prettifyError(result.error) },
                        { status: 500 }
                    );
                }

                return Response.json(result.data, { status: 200 })
            },
            "/library/songs": {
                POST: async (request) => {
                    // Validate song
                    const body = await request.json();
                    const dataResult = SongDataSchema.safeParse(body);

                    if (!dataResult.success) {
                        return Response.json(
                            { error: "Invalid song", issues: z.prettifyError(dataResult.error!) },
                            { status: 400 }
                        )
                    }

                    const data = dataResult.data;

                    // Validate library
                    const libraryResult = await loadLibrary();

                    if (!libraryResult.success) {
                        return Response.json(
                            { error: "Corrupted library", issues: z.prettifyError(libraryResult.error) },
                            { status: 500 }
                        )
                    }

                    const library = libraryResult.data;

                    // Add song
                    let id = crypto.randomUUID().split('-')[0]!;

                    while (library.songs.find(e => e.id == id))
                        id = crypto.randomUUID().split('-')[0]!;

                    const song: Song = { id, ...data };
                    library.songs.push(song);
                    saveLibrary(library);

                    return Response.json(song, { status: 201 });
                },

                PUT: async (request) => {
                    const body = await request.json();
                    const songResult = SongSchema.safeParse(body);

                    if (!songResult.success) {
                        return Response.json(
                            { error: "Invalid song", issues: z.prettifyError(songResult.error!) },
                            { status: 400 }
                        )
                    }

                    const song = songResult.data;

                    // Validate library
                    const libraryResult = await loadLibrary();

                    if (!libraryResult.success) {
                        return Response.json(
                            { error: "Corrupted library", issues: z.prettifyError(libraryResult.error) },
                            { status: 500 }
                        )
                    }

                    const library = libraryResult.data;

                    // Update song
                    const songIndex = library.songs.findIndex(e => e.id == song.id);

                    if (songIndex != -1) {
                        library.songs = [
                            ...library.songs.slice(0, songIndex),
                            song,
                            ...library.songs.slice(songIndex + 1)
                        ];

                        await saveLibrary(library);
                        return Response.json(song, { status: 200 });
                    }

                    return Response.json({ error: "Song not found" }, { status: 404 });
                },
            },
            "/library/songs/:id": {
                GET: async (request) => {
                    const id = request.params.id;
                    const result = await loadLibrary();

                    if (!result.success) {
                        return Response.json(
                            { error: "Corrupted library", issues: z.prettifyError(result.error) },
                            { status: 500 }
                        );
                    }

                    const library = result.data;
                    const song = library.songs.find(e => e.id == id);

                    if (song) return Response.json(song, { status: 200 });
                    return Response.json({ error: "Song not found" }, { status: 404 });
                },

                DELETE: async (request) => {
                    const id = request.params.id;
                    const result = await loadLibrary();

                    if (!result.success) {
                        return Response.json(
                            { error: "Corrupted library", issues: z.prettifyError(result.error) },
                            { status: 500 }
                        );
                    }

                    const library = result.data;
                    const songIndex = library.songs.findIndex(e => e.id == id);

                    if (songIndex != -1) {
                        const song = library.songs[songIndex]!;
                        library.songs.splice(songIndex, 1);

                        await saveLibrary(library);
                        return Response.json(song, { status: 200 });
                    }

                    return Response.json({ error: "Song not found" }, { status: 404 });
                }
            }
        }
    })

    console.log(`Listening at ${server.url}`);
}
