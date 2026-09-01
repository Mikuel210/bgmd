import type { Argument, Flag } from "../framework/command";
import { SongState, type Song, type SongData } from "../../core/library";
import { delete_librarySongs, get_librarySongs, post_librarySongs, put_librarySongs } from "../connection";
import { stringifySong } from "../formatter";

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
        state: SongState.Captured,
        mood: {},
        tags: []
    };

    for (const flag of flags) {
        switch (flag.longName) {
            case "disc-number": data.discNumber = flag.value as number; break;
            case "track-number": data.trackNumber = flag.value as number; break;
            case "youtube-source": data.youtubeSource = flag.value as string; break;
            case "local-source": data.localSource = flag.value as string; break;
        }
    }

    const addResult = await post_librarySongs(data, flags.some(e => e.longName == "track-number"));

    if (!addResult.success) {
        console.error(addResult.error);
        return 1;
    }

    console.log(`Song added: ${stringifySong(addResult.value)}`);
    return 0;
}

export async function songShow(args: Argument[], flags: Flag[]): Promise<number> {
    const song = args[0]!.value as Song;
    console.log(song);

    return 0;
}

export async function songEdit(args: Argument[], flags: Flag[]): Promise<number> {
    let song = args[0]!.value;
    let changesMade = false;

    for (const flag of flags) {
        switch (flag.longName) {
            case "name": song.name = flag.value as string; break;
            case "album": song.album = flag.value as string; break;
            case "artist": song.artist = flag.value as string; break;
            case "disc-number": song.discNumber = flag.value as number; break;
            case "track-number": song.trackNumber = flag.value as number; break;
            case "youtube-source": song.youtubeSource = flag.value as string; break;
            case "local-source": song.localSource = flag.value as string; break;
        }

        changesMade = true;
    }

    // Edit song
    const editResult = await put_librarySongs(song);

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
    const song = args[0]!.value as Song;
    const deleteResult = await delete_librarySongs(song.id);

    if (!deleteResult.success) {
        console.error(`Failed to remove song: ${deleteResult.error}`);
        return 1;
    }

    console.log(`Song removed: ${stringifySong(deleteResult.value)}`);
    return 0;
}
