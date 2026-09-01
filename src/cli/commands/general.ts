import type { Argument, Flag } from "../framework/command";
import type { Song, Status } from "../../core/library";
import { post_playback, get_playback, delete_playback } from "../connection";
import { stringifySong } from "../formatter";

export async function root(args: Argument[], flags: Flag[]): Promise<number> {
    console.log("Usage: bgmctl <command> [<args>]");
    console.log("See: bgmctl --help");
    return 0;
}

export async function play(args: Argument[], flags: Flag[]): Promise<number> {
    const song = args[0]!.value as Song;
    const result = await post_playback(song.id);

    if (!result.success) {
        console.error(`Failed to play song: ${result.error}`);
        return 1;
    }

    printStatus(result.value);
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

function printStatus(status: Status): void {
    if (status.playing) {
        console.log(`Now playing: ${stringifySong(status.song)}`);
        return;
    }

    console.log("Nothing playing");
}

export async function status(): Promise<number> {
    const result = await get_playback();

    if (!result.success) {
        console.error(`Failed to get status: ${result.error}`);
        return 1;
    }

    printStatus(result.value);
    return 0;
}
