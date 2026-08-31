import type { Argument, Flag } from "../framework/command";
import type { SongData } from "../../core/library";
import { delete_librarySongs, get_librarySongs } from "../connection";
import { addSong, editSong, stringifySong } from "../helpers";

export async function songAdd(args: Argument[], flags: Flag[]): Promise<number> {
    const name = args[0]!.value as string;
    const album = args[1]!.value as string;
    const artist = args[2]!.value as string;

    let data: SongData = {
        name: name,
        album: album,
        artist: artist,
        discNumber: 1,
        trackNumber: 1,
        state: 0,
        mood: {},
        tags: []
    };

    for (const flag of flags) {
        if (flag.longName == "disc-number")
            data.discNumber = flag.value as number;

        if (flag.longName == "track-number")
            data.trackNumber = flag.value as number;

        if (flag.longName == "youtube-source")
            data.youtubeSource = flag.value as string;

        if (flag.longName == "local-source")
            data.localSource = flag.value as string;
    }

    const addResult = await addSong(data, flags.some(e => e.longName == "track-number"));

    if (!addResult.success) {
        console.error(addResult.error);
        return 1;
    }

    console.log(`Song added: ${stringifySong(addResult.value)}`);
    return 0;
}

export async function songShow(args: Argument[], flags: Flag[]): Promise<number> {
    const id = args[0]!.value as string;
    const result = await get_librarySongs(id);

    if (!result.success) {
        console.error(`Failed to show song: ${result.error}`);
        return 1;
    }

    console.log(result.value);
    return 0;
}

export async function songEdit(args: Argument[], flags: Flag[]): Promise<number> {
    // Load song
    const id = args[0]!.value as string;
    const songResult = await get_librarySongs(id);

    if (!songResult.success) {
        console.error(`Failed to fetch song: ${songResult.error}`);
        return 1;
    }

    // Edit song
    let song = songResult.value;
    let changesMade = false;

    for (const flag of flags) {
        if (flag.longName == "name") {
            song.name = flag.value as string;
            changesMade = true;
        }

        if (flag.longName == "album") {
            song.album = flag.value as string;
            changesMade = true;
        }

        if (flag.longName == "artist") {
            song.artist = flag.value as string;
            changesMade = true;
        }

        if (flag.longName == "disc-number") {
            song.discNumber = flag.value as number;
            changesMade = true;
        }

        if (flag.longName == "track-number") {
            song.trackNumber = flag.value as number;
            changesMade = true;
        }

        if (flag.longName == "youtube-source") {
            song.youtubeSource = flag.value as string;
            changesMade = true;
        }

        if (flag.longName == "local-source") {
            song.localSource = flag.value as string;
            changesMade = true;
        }
    }

    // Edit song
    const editResult = await editSong(song);

    if (!editResult.success) {
        console.error(editResult.error);
        return 1;
    }

    if (changesMade)
        console.log(`Song updated: ${stringifySong(song)}`);
    else
        console.warn("No changes made");

    return 0;
}

export async function songRemove(args: Argument[], flags: Flag[]): Promise<number> {
    const id = args[0]!.value as string;
    const deleteResult = await delete_librarySongs(id);

    if (!deleteResult.success) {
        console.error(`Failed to remove song: ${deleteResult.error}`);
        return 1;
    }

    console.log(`Song removed: ${stringifySong(deleteResult.value)}`);
    return 0;
}
