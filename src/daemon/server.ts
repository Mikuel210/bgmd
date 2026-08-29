import z from "zod"
import type { Library, Song } from "./library"
import { SongSchema, loadLibrary, saveLibrary } from "./library"

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

                    while (id in library.songs)
                        id = crypto.randomUUID().split('-')[0]!;

                    library.songs[id] = song;
                    saveLibrary(library);

                    return Response.json({ created: true, id, song }, { status: 201 });
                },

                PUT: async (request) => {
                    const body = await request.json() as Record<string, any>;
                    const songResult = SongSchema.safeParse(body.song);

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

                    // Update song
                    const id = body.id;

                    if (id in library.songs) {
                        library.songs[id] = song;

                        await saveLibrary(library);
                        return Response.json({ updated: true, song }, { status: 200 });
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

                    if (id in library.songs) {
                        return Response.json(library.songs[id], { status: 200 });
                    }

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

                    if (id in library.songs) {
                        const song = library.songs[id];
                        delete library.songs[id];

                        await saveLibrary(library);
                        return Response.json({ deleted: true, song }, { status: 200 });
                    }

                    return Response.json({ error: "Song not found"}, { status: 404 });
                }
            },
            "/play/:id": {
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

                    if (id in library.songs) {
                        const song = library.songs[id] as Song;

                        if (song.youtubeSource) {
                            Bun.spawn(["mpv", song.youtubeSource, "--no-video", "--aid=1"])
                            return Response.json({ playing: true }, { status: 200 });
                        }

                        return Response.json({ error: "No source available" }, { status: 500 });
                    }

                    return Response.json({ error: "Song not found"}, { status: 404 });
                }
            }
        }
    })

    console.log(`Listening at ${server.url}`);
}
