import type { IArgument, IFlag } from "./command"
import { post_librarySongs } from "../connection"

async function addSong(args: IArgument[], flags: IFlag[]): Promise<number> {
    const result = await post_librarySongs({
        name: "meoww",
        album: "meowwww",
        artist: "barkabrk",
        source: 0,
        locator: "",
        state: 0,
        mood: {},
        tags: []
    });

    if (result.status == 200)
        return 0;

    console.log(result.json)
    return 1;
}

export { addSong }
