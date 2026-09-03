import type { Argument, Flag } from "../framework/command";
import { type Entity  } from "../../core/library";
import { post_playback, get_playback, delete_playback } from "../connection";
import { stringifyStatus } from "../formatter";

export async function root(args: Argument[], flags: Flag[]): Promise<number> {
    console.log("usage: bgmctl <command> [<args>]");
    console.log("see: bgmctl --help");
    return 0;
}

export async function play(args: Argument[], flags: Flag[]): Promise<number> {
    const entity = args[0]!.value as Entity;
    let result = await post_playback(entity);

    if (!result.success) {
        console.error(`Failed to play ${entity.type}: ${result.error}`);
        return 1;
    }

    stringifyStatus(result.value);
    return 0;
}

export async function stop(args: Argument[], flags: Flag[]): Promise<number> {
    const result = await delete_playback();

    if (!result.success) {
        console.error(`Failed to stop playback: ${result.error}`);
        return 1;
    }

    console.log("Playback stopped");
    return 0;
}



export async function status(): Promise<number> {
    const result = await get_playback();

    if (!result.success) {
        console.error(`Failed to get status: ${result.error}`);
        return 1;
    }

    stringifyStatus(result.value);
    return 0;
}
