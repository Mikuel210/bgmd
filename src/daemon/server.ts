import z from "zod"
import type { Library, Song, SongWrapper } from "./library"
import { SongSchema, SongWrapperSchema, loadLibrary, saveLibrary } from "./library"
import { getStatus, play, stop } from "./daemon"

export function serve(): void {
    const server = Bun.serve({
        port: 8686,
        error(e) {
            return Response.json({ error: String(e) }, { status: 500 })
        },
        routes: {
            "/": () => new Response("bgmd: All systems nominal"),
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
                    const songResult = SongSchema.safeParse(body);

                    if (!songResult.success) {
                        return Response.json(
                            { error: "Invalid song", issues: z.prettifyError(songResult.error!) },
                            { status: 400 }
                        )
                    }

                    const song = songResult.data as Song;

                    // Validate library
                    const libraryResult = await loadLibrary();

                    if (!libraryResult.success) {
                        return Response.json(
                            { error: "Corrupted library", issues: z.prettifyError(libraryResult.error) },
                            { status: 500 }
                        )
                    }

                    const library = libraryResult.data as Library;

                    // Add song
                    let id = crypto.randomUUID().split('-')[0]!;

                    while (library.songWrappers.find(e => e.id == id))
                        id = crypto.randomUUID().split('-')[0]!;

                    const songWrapper: SongWrapper = { id, song };
                    library.songWrappers.push(songWrapper);
                    saveLibrary(library);

                    return Response.json({ created: true, wrapper: songWrapper }, { status: 201 });
                },

                PUT: async (request) => {
                    const body = await request.json();
                    const songWrapperResult = SongWrapperSchema.safeParse(body);

                    if (!songWrapperResult.success) {
                        return Response.json(
                            { error: "Invalid song", issues: z.prettifyError(songWrapperResult.error!) },
                            { status: 400 }
                        )
                    }

                    const songWrapper = songWrapperResult.data as SongWrapper;

                    // Validate library
                    const libraryResult = await loadLibrary();

                    if (!libraryResult.success) {
                        return Response.json(
                            { error: "Corrupted library", issues: z.prettifyError(libraryResult.error) },
                            { status: 500 }
                        )
                    }

                    const library = libraryResult.data as Library;

                    // Update song
                    const songWrapperIndex = library.songWrappers.findIndex(e => e.id == songWrapper.id);

                    if (songWrapperIndex != -1) {
                        library.songWrappers = [
                            ...library.songWrappers.slice(0, songWrapperIndex),
                            songWrapper,
                            ...library.songWrappers.slice(songWrapperIndex + 1)
                        ];

                        await saveLibrary(library);
                        return Response.json({ updated: true, songWrapper }, { status: 200 });
                    }

                    return Response.json({ error: "Song not found"}, { status: 404 });
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

                    const library = result.data as Library;
                    const songWrapper = library.songWrappers.find(e => e.id == id);

                    if (songWrapper) return Response.json(songWrapper, { status: 200 });
                    return Response.json({ error: "Song not found"}, { status: 404 });
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

                    const library = result.data as Library;
                    const songIndex = library.songWrappers.findIndex(e => e.id == id);

                    if (songIndex != -1) {
                        const songWrapper = library.songWrappers[songIndex]!;
                        library.songWrappers.splice(songIndex, 1);

                        await saveLibrary(library);
                        return Response.json({ deleted: true, songWrapper }, { status: 200 });
                    }

                    return Response.json({ error: "Song not found" }, { status: 404 });
                }
            },
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
                const songWrapper = library.songWrappers.find(e => e.id == id);

                if (songWrapper) return play(songWrapper);
                return Response.json({ error: "Song not found" }, { status: 404 });
            },
            "/stop": async (request) => {
                stop();
                return Response.json({ stopped: true }, { status: 200 });
            },
            "/status": async () => Response.json(getStatus(), { status: 200 }),
        }
    })

    console.log(`Listening at ${server.url}`);
}
