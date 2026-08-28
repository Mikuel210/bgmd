import type { Argument } from "./argument"
import type { Flag } from "./flag"
import { post_librarySongs } from "../connection"

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

export async function songRemove(args: Argument[], flags: Flag[]): Promise<number> {

}
