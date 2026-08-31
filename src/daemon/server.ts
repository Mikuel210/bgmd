import { SongDataSchema, SongSchema, type Library, type Song } from "../core/library"
import { getStatus, play, stop } from "./daemon"
import z from "zod"
import { addSong, editSong, getLibrary, getSong, removeSong } from "./library";

export function serve(): void {
    const server = Bun.serve({
        port: 8686,
        error: (e) => Response.json({ error: String(e) }, { status: 500 }),
        routes: {
            "/": {
                GET: () => new Response("bgmd: All systems nominal")
            },
            "/playback": {
                GET: async () => Response.json(getStatus(), { status: 200 }),

                POST: async (request) => {
                    const body = await request.json() as Record<string, any>;
                    const id = body.id;

                    // Play song
                    const result = await getSong(id);

                    if (!result.success) {
                        return Response.json(
                            { error: result },
                            { status: 500 }
                        );
                    }

                    return play(result.value);
                },

                DELETE: async () => {
                    stop();
                    return Response.json(getStatus(), { status: 200 });
                }
            },
            "/library": {
                GET: async() => {
                    const result = await getLibrary();

                    if (!result.success) {
                        return Response.json(
                            { error: result.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(result.value, { status: 200 });
                }
            },
            "/library/songs": {
                POST: async (request) => {
                    // Validate song
                    const body = await request.json() as Record<string, any>;
                    const dataResult = SongDataSchema.safeParse(body.data);

                    if (!dataResult.success) {
                        return Response.json(
                            { error: "Invalid song", issues: z.prettifyError(dataResult.error!) },
                            { status: 400 }
                        )
                    }

                    const data = dataResult.data;

                    // Add song
                    const addResult = await addSong(data, body.explicitTrackNumber);

                    if (!addResult.success) {
                        return Response.json(
                            { error: addResult.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(addResult.value, { status: 201 });
                },

                PUT: async (request) => {
                    const body = await request.json() as Record<string, any>;
                    const songResult = SongSchema.safeParse(body);

                    if (!songResult.success) {
                        return Response.json(
                            { error: "Invalid song", issues: z.prettifyError(songResult.error!) },
                            { status: 400 }
                        )
                    }

                    const song = songResult.data;

                    // Update song
                    const editResult = await editSong(song);

                    if (!editResult.success) {
                        return Response.json(
                            { error: editResult.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(editResult.value, { status: 200 });
                }
            },
            "/library/songs/:id": {
                GET: async (request) => {
                    const id = request.params.id;
                    const result = await getSong(id);

                    if (!result.success) {
                        return Response.json(
                            { error: result.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(result.value, { status: 200 });
                },

                DELETE: async (request) => {
                    const id = request.params.id;
                    const result = await removeSong(id);

                    if (!result.success) {
                        return Response.json(
                            { error: result.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(result.value, { status: 404 });
                }
            }
        }
    })

    console.log(`Listening at ${server.url}`);
}
