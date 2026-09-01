import type { Argument, Flag } from "../framework/command";
import { get_libraryAlbums } from "../connection";
import { stringifyAlbum } from "../formatter";

export async function albumList(args: Argument[], flags: Flag[]): Promise<number> {
    const result = await get_libraryAlbums();

    if (!result.success) {
        console.error(result.error);
        return 1;
    }

    for (const album of result.value)
        console.log(stringifyAlbum(album));

    return 0;
}
