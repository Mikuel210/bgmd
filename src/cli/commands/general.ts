import type { Argument, Flag } from "../framework/command";
import { type Entity } from "../../core/library";
import { post_playback, get_playback, delete_playback } from "../connection";
import { logStatus } from "../formatter";

export async function root(args: Argument[], flags: Flag[]): Promise<number> {
    console.log("usage: bgmctl <command> [<args>]");
    console.log("see: bgmctl --help");
    return 0;
}

export async function play(args: Argument[], flags: Flag[]): Promise<number> {
    const entity = args[0]!.value as Entity;
    const next = flags.some(e => e.longName == "next");
    const last = flags.some(e => e.longName == "last");

    if (next && last) {
        console.error("--next and --last can't be used at the same time");
        return 1;
    }

    const method = next ? "next" : (last ? "last" : "replace");
    const result = await post_playback({ method, entity });

    if (!result.success) {
        console.error(`Failed to play ${entity.type}: ${result.error}`);
        return 1;
    }

    logStatus(result.value);
    return 0;
}

export async function skip(args: Argument[], flags: Flags[]): Promise<number> {
    const result = await post_playback({ method: "skip" });

    if (!result.success) {
        console.error(`Failed to skip song: ${result.error}`);
        return 1;
    }

    logStatus(result.value);
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

    logStatus(result.value);
    return 0;
}
