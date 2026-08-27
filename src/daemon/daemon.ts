import { SongSchema, loadLibrary, addSong } from "./library"

const server = Bun.serve({
    port: 8686,
    routes: {
        "/": () => new Response("bgmd: All systems nominal"),
        "/library": async () => Response.json(await loadLibrary()),
        "/library/songs": {
            POST: async (request) => {
                const body = await request.json();
                const song = SongSchema.parse(body);
                addSong(song);

                return Response.json({ created: true, song });
            }
        }
    }
})

console.log(`Listening at ${server.url}`)
