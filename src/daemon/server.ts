import { addSong, editAlbum, editArtist, editSong, getAlbums, getArtists, getSong, getSongs, removeAlbum, removeArtist, removeSong } from "./library";
import { AlbumDataSchema, ArtistDataSchema, SongDataSchema, SongSchema, type Entity, type Status } from "../core/library"
import type { Result } from "../core/task";
import { getStatus, playAlbum, playArtist, playSong, stop } from "./player"
import { PORT } from "../core/config";
import z from "zod"

export function serve(): void {
    const server = Bun.serve({
        port: PORT,
        error: (e) => Response.json({ error: String(e) }, { status: 500 }),
        routes: {
            "/": {
                GET: () => new Response("bgmd: All systems nominal")
            },
            "/playback": {
                GET: async () => Response.json(getStatus(), { status: 200 }),

                POST: async (request) => {
                    const entity = await request.json() as Entity;
                    let playResult: Result<Status>;

                    if (entity.type == "song")
                        playResult = playSong(entity.value);
                    else if (entity.type == "album")
                        playResult = playAlbum(entity.value);
                    else
                        playResult = playArtist(entity.value);

                    if (!playResult.success) {
                        return Response.json(
                            { error: playResult.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(playResult.value, { status: 200 });
                },

                DELETE: async () => {
                    const status = stop();
                    return Response.json(status, { status: 200 });
                }
            },
            "/library/songs": {
                GET: async () => {
                    const result = await getSongs();

                    if (!result.success) {
                        return Response.json(
                            { error: result.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(result.value, { status: 200 });
                },

                POST: async (request) => {
                    // Validate song
                    const body = await request.json() as Record<string, any>;
                    const dataResult = SongDataSchema.safeParse(body.data);

                    if (!dataResult.success) {
                        return Response.json(
                            { error: "Invalid song", issues: z.prettifyError(dataResult.error!) },
                            { status: 400 }
                        );
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
                        );
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

                    return Response.json(result.value, { status: 200 });
                }
            },
            "/library/albums": {
                GET: async () => {
                    const result = await getAlbums();

                    if (!result.success) {
                        return Response.json(
                            { error: result.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(result.value, { status: 200 });
                },

                PUT: async (request) => {
                    const body = await request.json() as Record<string, any>;
                    const oldDataResult = AlbumDataSchema.safeParse(body.oldData);
                    const newDataResult = AlbumDataSchema.safeParse(body.newData);

                    if (!oldDataResult.success) {
                        return Response.json(
                            { error: "Invalid album", issues: z.prettifyError(oldDataResult.error!) },
                            { status: 400 }
                        );
                    }

                    if (!newDataResult.success) {
                        return Response.json(
                            { error: "Invalid album", issues: z.prettifyError(newDataResult.error!) },
                            { status: 400 }
                        );
                    }

                    // Update album
                    const editResult = await editAlbum(oldDataResult.data, newDataResult.data);

                    if (!editResult.success) {
                        return Response.json(
                            { error: editResult.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(editResult.value, { status: 200 });
                },

                DELETE: async (request) => {
                    const body = await request.json() as Record<string, any>;
                    const dataResult = AlbumDataSchema.safeParse(body);

                    if (!dataResult.success) {
                        return Response.json(
                            { error: "Invalid album", issues: z.prettifyError(dataResult.error!) },
                            { status: 400 }
                        );
                    }

                    // Delete album
                    const deleteResult = await removeAlbum(dataResult.data);

                    if (!deleteResult.success) {
                        return Response.json(
                            { error: deleteResult.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(deleteResult.value, { status: 200 });
                }
            },
            "/library/artists": {
                GET: async () => {
                    const result = await getArtists();

                    if (!result.success) {
                        return Response.json(
                            { error: result.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(result.value, { status: 200 });
                },

                PUT: async (request) => {
                    const body = await request.json() as Record<string, any>;
                    const oldDataResult = ArtistDataSchema.safeParse(body.oldData);
                    const newDataResult = ArtistDataSchema.safeParse(body.newData);

                    if (!oldDataResult.success) {
                        return Response.json(
                            { error: "Invalid artist", issues: z.prettifyError(oldDataResult.error!) },
                            { status: 400 }
                        );
                    }

                    if (!newDataResult.success) {
                        return Response.json(
                            { error: "Invalid artist", issues: z.prettifyError(newDataResult.error!) },
                            { status: 400 }
                        );
                    }

                    // Update artist
                    const editResult = await editArtist(oldDataResult.data, newDataResult.data);

                    if (!editResult.success) {
                        return Response.json(
                            { error: editResult.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(editResult.value, { status: 200 });
                },

                DELETE: async (request) => {
                    const body = await request.json() as Record<string, any>;
                    const dataResult = ArtistDataSchema.safeParse(body);

                    if (!dataResult.success) {
                        return Response.json(
                            { error: "Invalid artist", issues: z.prettifyError(dataResult.error!) },
                            { status: 400 }
                        );
                    }

                    // Delete artist
                    const deleteResult = await removeArtist(dataResult.data);

                    if (!deleteResult.success) {
                        return Response.json(
                            { error: deleteResult.error },
                            { status: 500 }
                        );
                    }

                    return Response.json(deleteResult.value, { status: 200 });
                }
            }
        }
    })

    console.log(`Listening at ${server.url}`);
}
