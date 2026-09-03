import type { Argument, Flag } from "../framework/command";
import type { Artist } from "../../core/library";
import { logObject, stringifyAlbum, stringifyArtist } from "../formatter";
import { get_libraryArtists } from "../connection";

export async function artistList(args: Argument[], flags: Flag[]): Promise<number> {
    const result = await get_libraryArtists();

    if (!result.success) {
        console.error(`Failed to fetch artists: ${result.error}`);
        return 1;
    }

    for (const artist of result.value)
        console.log(stringifyArtist(artist));

    return 0;
}

export async function artistShow(args: Argument[], flags: Flag[]): Promise<number> {
    const artist = args[0]!.value as Artist;

    logObject({
        name: artist.name
    });

    console.log("\nAlbums:");

    for (const album of artist.albums)
        console.log(`  ${stringifyAlbum(album)}`);

    return 0;
}
