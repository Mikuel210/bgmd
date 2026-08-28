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

    const result = await post_librarySongs({
        name: name,
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

    return 1;
}
