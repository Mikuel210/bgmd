import type { Argument, Flag } from "../framework/command";
import { stringifySong } from "../formatter";
import { get_library } from "../connection";

export async function library(args: Argument[], flags: Flag[]): Promise<number> {
    const result = await get_library();

    if (!result.success) {
        console.error(`Failed to fetch library: ${result.error}`);
        return 1;
    }

    for (const song of result.value.songs)
        console.log(stringifySong(song));

    return 0;
}
