import z from "zod"
import type { Library, Song } from "./library"
import { SongSchema, loadLibrary, saveLibrary } from "./library"

const server = Bun.serve({
    port: 8686,
    error(e) {
        return Response.json({ error: String(e) }, { status: 500 })
    },
    routes: {
        "/": () => new Response("bgmd: All systems nominal"),
        "/library": async () => Response.json(await loadLibrary()),
        "/library/songs": {
            POST: async (request) => {
                // Validate song
                const body = await request.json();
                const songResult = SongSchema.safeParse(body);

                if (!songResult.success) {
                    return Response.json(
                        { error: "Invalid song", issues: z.prettifyError(songResult.error) },
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
                let uuid = crypto.randomUUID().split('-')[0]!;

                while (uuid in library.songs)
                    uuid = crypto.randomUUID().split('-')[0]!;

                library.songs[uuid] = song;
                saveLibrary(library);

                return Response.json({ created: true, song }, { status: 200 });
            }
        }
    }
})

console.log(`Listening at ${server.url}`)
