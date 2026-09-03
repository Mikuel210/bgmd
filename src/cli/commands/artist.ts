import type { Argument, Flag } from "../framework/command";
import type { AlbumData, Artist, ArtistData } from "../../core/library";
import { logObject, stringifyAlbum, stringifyArtist } from "../formatter";
import { delete_libraryArtists, get_libraryArtists, put_libraryArtists } from "../connection";

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

export async function artistEdit(args: Argument[], flags: Flag[]): Promise<number> {
    const artist = args[0]!.value as Artist;
    let changesMade = false;

    const oldData: ArtistData = { name: artist.name };
    const newData: ArtistData = structuredClone(oldData);

    for (const flag of flags) {
        switch (flag.longName) {
            case "name": newData.name = flag.value as string; break;
        }

        changesMade = true;
    }

    // Update album
    const result = await put_libraryArtists(oldData, newData);

    if (!result.success) {
        console.error(`Failed to edit artist: ${result.error}`);
        return 1;
    }

    if (changesMade)
        console.log(`Artist updated: ${stringifyArtist(result.value)}`);
    else
        console.warn("No changes made");

    return 0;
}

export async function artistRemove(args: Argument[], flags: Flag[]): Promise<number> {
    const artist = args[0]!.value as Artist;
    const result = await delete_libraryArtists({ name: artist.name });

    if (!result.success) {
        console.error(`Failed to remove artist: ${result.error}`);
        return 1;
    }

    console.log(`Artist removed: ${stringifyArtist(result.value)}`);
    return 1;
}
