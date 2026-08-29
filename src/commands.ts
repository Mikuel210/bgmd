import type { Argument, Flag } from "./commands/command";
import type { Library, Song } from "./daemon/library";
import { delete_librarySongs, get_library, get_librarySongs, get_play, get_stop, post_librarySongs, put_librarySongs } from "./connection";

export async function root(args: Argument[], flags: Flag[]): Promise<number> {
    console.log("Usage: bgmctl <command> [<args>]");
    console.log("See: bgmctl --help");
    return 0;
}

function stringifySong(id: string, song: Song): string {
    return `[${id}] ${song.artist} - ${song.name}`;
}

export async function library(args: Argument[], flags: Flag[]): Promise<number> {
    const result = await get_library();
    const json = await result.json() as Record<string, any>;

    if (!result.ok) {
        console.error(`Failed to fetch library: ${json.error}`);
        return 1;
    }

    const songs = json.songs as Record<string, Song>;

    for (const [id, song] of Object.entries(songs))
        console.log(stringifySong(id, song));

    return 0;
}

function getId(library: Library, song: Song): string {
    return Object.keys(library.songs).filter(e => library.songs[e] == song)[0]!;
}

function isValidTrackNumber(library: Library, song: Song): boolean {
    const otherSongs = Object.values(library.songs)
        .filter(e => getId(library, e) != getId(library, song));

    return !otherSongs.some(e =>
        e.artist == song.artist &&
        e.album == song.album &&
        e.discNumber == song.discNumber &&
        e.trackNumber == song.trackNumber
    );
}

export async function songAdd(args: Argument[], flags: Flag[]): Promise<number> {
    const name = args[0]!.value as string;
    const album = args[1]!.value as string;
    const artist = args[2]!.value as string;

    let song: Song = {
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
            song.discNumber = flag.value as number;

        if (flag.longName == "track-number")
            song.trackNumber = flag.value as number;

        if (flag.longName == "youtube-source")
            song.youtubeSource = flag.value as string;

        if (flag.longName == "local-source")
            song.localSource = flag.value as string;
    }

    // Validate track number
    const libraryResult = await get_library();
    const libraryJson = await libraryResult.json() as Record<string, any>;

    if (!libraryResult.ok) {
        console.error(`Failed to fetch library: ${libraryJson.error}`);
        return 1;
    }

    const library = libraryJson as Library;

    if (!isValidTrackNumber(library, song)) {
        if (flags.some(e => e.longName == "track-number")) {
            console.error(`Track number already exists in disc`);
            return 1;
        }

        // Pick next valid track number
        const discSongs = Object.values(library.songs).filter(e =>
            e.artist == song.artist &&
            e.album == song.album &&
            e.discNumber == song.discNumber
        ).sort((a, b) => a.trackNumber - b.trackNumber);

        let lastTrackNumber = 0;

        for (const discSong of discSongs) {
            if (discSong.trackNumber == lastTrackNumber + 1) {
                lastTrackNumber++;
                continue;
            }

            break;
        }

        song.trackNumber = lastTrackNumber + 1;
    }

    // Add song
    const addResult = await post_librarySongs(song);
    const addJson = await addResult.json() as Record<string, any>;

    if (!addResult.ok) {
        console.error(`Failed to add song: ${addJson.error}`);
        return 1;
    }

    console.log(`Song added: ${stringifySong(addJson.id, addJson.song)}`);
    return 0;
}

export async function songShow(args: Argument[], flags: Flag[]): Promise<number> {
    const id = args[0]!.value as string;
    const result = await get_librarySongs(id);
    const json = await result.json() as Record<string, any>;

    if (!result.ok) {
        console.error(`Failed to show song: ${json.error}`);
        return 1;
    }

    const song = json as Song;
    console.log(song);

    return 0;
}

export async function songEdit(args: Argument[], flags: Flag[]): Promise<number> {
    // Load song
    const id = args[0]!.value as string;
    const songResult = await get_librarySongs(id);
    const songJson = await songResult.json() as Record<string, any>;

    if (!songResult.ok) {
        console.error(`Failed to fetch song: ${songJson.error}`);
        return 1;
    }

    const song = songJson as Song;

    // Edit song
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

    // Validate track number
    const libraryResult = await get_library();
    const libraryJson = await libraryResult.json() as Record<string, any>;

    if (!libraryResult.ok) {
        console.error(`Failed to fetch library: ${libraryJson.error}`);
        return 1;
    }

    const library = libraryJson as Library;

    if (!isValidTrackNumber(library, song)) {
        console.error(`A song with the same track number is already in the disc`);
        return 1;
    }

    // Save changes
    put_librarySongs(id, song);

    if (changesMade)
        console.log(`Song updated: ${stringifySong(id, song)}`);
    else
        console.warn("No changes made");

    return 0;
}

export async function songRemove(args: Argument[], flags: Flag[]): Promise<number> {
    const id = args[0]!.value as string;
    const getResult = await get_librarySongs(id);

    if (!getResult.ok) {
        const json = await getResult.json() as Record<string, any>;
        console.error(`Failed to remove song: ${json.error}`);

        return 1;
    }

    const deleteResult = await delete_librarySongs(id);

    if (!deleteResult.ok) {
        const deleteJson = await deleteResult.json() as Record<string, any>;
        console.error(`Failed to remove song: ${deleteJson.error}`);

        return 1;
    }

    const getJson = await getResult.json() as Record<string, any>;
    const song = getJson as Song;

    console.log(`Song removed: ${stringifySong(id, song)}`);
    return 0;
}

export async function play(args: Argument[], flags: Flag[]): Promise<number> {
    const id = args[0]!.value as string;
    const result = await get_play(id);
    const json = await result.json() as Record<string, any>;

    if (!result.ok) {
        console.error(`Failed to play song: ${json.error}`);
        return 1;
    }

    console.log(`Now playing: ${stringifySong(id, json.song)}`);
    return 0;
}

export async function stop(args: Argument[], flags: Flag[]): Promise<number> {
    const result = await get_stop();
    const json = await result.json() as Record<string, any>;

    if (!result.ok) {
        console.error(`Failed to stop playback: ${json.error}`);
        return 1;
    }

    console.log("Playback stopped");
    return 0;
}
