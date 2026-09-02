import type { Argument, Flag } from "../framework/command";
import type { Album, AlbumData } from "../../core/library";
import { DARK_GREY, logObject, stringifyAlbum } from "../formatter";
import { get_libraryAlbums, put_libraryAlbums } from "../connection";
import { styleText } from "node:util";

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

export async function albumShow(args: Argument[], flags: Flag[]): Promise<number> {
    const album = args[0]!.value as Album;

    logObject({
        name: album.name,
        artist: album.artist
    }, false);

    console.log("\nTracks:");

    for (const song of album.songs)
        console.log(`  ${song.trackNumber}. ${song.name} ${styleText(DARK_GREY, `[${song.id}]`)}`);

    return 0;
}

export async function albumEdit(args: Argument[], flags: Flag[]): Promise<number> {
    const album = args[0]!.value as Album;
    let changesMade = false;

    const oldData: AlbumData = { name: album.name, artist: album.artist };
    const newData: AlbumData = structuredClone(oldData);

    for (const flag of flags) {
        switch (flag.longName) {
            case "name": newData.name = flag.value as string; break;
            case "artist": newData.artist = flag.value as string; break;
        }

        changesMade = true;
    }

    // Update album
    const result = await put_libraryAlbums(oldData, newData);

    if (!result.success) {
        console.error(result.error);
        return 1;
    }

    if (changesMade)
        console.log(`Album updated: ${stringifyAlbum(result.value)}`);
    else
        console.warn("No changes made");

    return 0;
}
