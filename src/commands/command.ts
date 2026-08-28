import type { Argument } from "./argument"
import type { Flag } from "./flag"
import { delete_librarySongs, get_librarySongs, post_librarySongs } from "../connection"
import type { Song } from "../daemon/library";

export interface Command {
    route: string[],
    description: string,
    args: Argument[],
    flags: Flag[],
    run: (args: Argument[], flags: Flag[]) => Promise<number>
}

export async function root(args: Argument[], flags: Flag[]): Promise<number> {
    console.log("Usage: bgmctl <command> [<args>]");
    console.log("See: bgmctl --help");
    return 0;
}

export async function songAdd(args: Argument[], flags: Flag[]): Promise<number> {
    const name = args[0]!.value as string;
    const album = args[1]!.value as string;
    const artist = args[2]!.value as string;

    const result = await post_librarySongs({
        name: name,
        album: album,
        artist: artist,
        source: 0,
        locator: "",
        state: 0,
        mood: {},
        tags: []
    });

    if (!result.ok) {
        const json = await result.json() as Record<string, any>;
        console.error(`Failed to add song: ${json.error}`);

        return 1;
    }

    console.log(`Song added: ${artist} - ${name}`);
    return 0;
}

export async function songShow(args: Argument[], flags: Flag[]): Promise<number> {
    const id = args[0]!.value as string;
    const result = await get_librarySongs(id);
    const json = await result.json() as Record<string, any>;

    if (!result.ok) {
        console.error(`Failed to show song: ${json.error}`);
        return 1;
    }

    const song = json as Song;
    console.log(song);

    return 0;
}

export async function songRemove(args: Argument[], flags: Flag[]): Promise<number> {
    const id = args[0]!.value as string;
    const getResult = await get_librarySongs(id);

    if (!getResult.ok) {
        const json = await getResult.json() as Record<string, any>;
        console.error(`Failed to remove song: ${json.error}`);

        return 1;
    }

    const deleteResult = await delete_librarySongs(id);

    if (!deleteResult.ok) {
        const deleteJson = await deleteResult.json() as Record<string, any>;
        console.error(`Failed to remove song: ${deleteJson.error}`);

        return 1;
    }

    const getJson = await getResult.json() as Record<string, any>;
    const song = getJson as Song;

    console.log(`Song removed: ${song.artist} - ${song.name}`);
    return 0;
}
