import type { Argument, Flag } from "./commands/command";
import type { Library, Song, SongWrapper } from "./daemon/library";
import { delete_librarySongs, get_library, get_librarySongs, get_play, get_status, get_stop, put_librarySongs } from "./connection";
import { searchAlbums, searchArtists, searchTracks, tracksFromAlbum, tracksFromArtist, type Album, type Artist, type Track } from "./resolver";
import { addSong, capture, editSong, stringifySong } from "./helpers";
import { createSpinner, forEachConcurrent, reserveLines } from "./task";
import { downloadSong } from "./downloader";
import type { Status } from "./daemon/daemon";

const CONCURRENT_DOWNLOADS = 5;

export async function root(args: Argument[], flags: Flag[]): Promise<number> {
    console.log("Usage: bgmctl <command> [<args>]");
    console.log("See: bgmctl --help");
    return 0;
}

export async function library(args: Argument[], flags: Flag[]): Promise<number> {
    const result = await get_library();
    const json = await result.json() as Record<string, any>;

    if (!result.ok) {
        console.error(`Failed to fetch library: ${json.error}`);
        return 1;
    }

    const songWrappers = json.songWrappers as SongWrapper[];

    for (const songWrapper of songWrappers)
        console.log(stringifySong(songWrapper));

    return 0;
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

    const addResult = await addSong(song, flags.some(e => e.longName == "track-number"));
    const addJson = addResult.value as Record<string, any>;

    if (!addResult.success) {
        console.error(addJson.error);
        return 1;
    }

    const songWrapper = addJson.wrapper as SongWrapper;
    console.log(`Song added: ${stringifySong(songWrapper)}`);

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

    const songWrapper = json as SongWrapper;
    console.log(songWrapper);

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

    const songWrapper = songJson as SongWrapper;

    // Edit song
    let changesMade = false;

    for (const flag of flags) {
        if (flag.longName == "name") {
            songWrapper.song.name = flag.value as string;
            changesMade = true;
        }

        if (flag.longName == "album") {
            songWrapper.song.album = flag.value as string;
            changesMade = true;
        }

        if (flag.longName == "artist") {
            songWrapper.song.artist = flag.value as string;
            changesMade = true;
        }

        if (flag.longName == "disc-number") {
            songWrapper.song.discNumber = flag.value as number;
            changesMade = true;
        }

        if (flag.longName == "track-number") {
            songWrapper.song.trackNumber = flag.value as number;
            changesMade = true;
        }

        if (flag.longName == "youtube-source") {
            songWrapper.song.youtubeSource = flag.value as string;
            changesMade = true;
        }

        if (flag.longName == "local-source") {
            songWrapper.song.localSource = flag.value as string;
            changesMade = true;
        }
    }

    // Edit song
    const editResult = await editSong(songWrapper);

    if (!editResult.success) {
        console.error(editResult.error);
        return 1;
    }

    if (changesMade)
        console.log(`Song updated: ${stringifySong(songWrapper)}`);
    else
        console.warn("No changes made");

    return 0;
}

export async function songRemove(args: Argument[], flags: Flag[]): Promise<number> {
    const id = args[0]!.value as string;
    const getResult = await get_librarySongs(id);
    const getJson = await getResult.json() as Record<string, any>;

    if (!getResult.ok) {
        console.error(`Failed to fetch song: ${getJson.error}`);
        return 1;
    }

    const deleteResult = await delete_librarySongs(id);

    if (!deleteResult.ok) {
        const deleteJson = await deleteResult.json() as Record<string, any>;
        console.error(`Failed to remove song: ${deleteJson.error}`);

        return 1;
    }

    const songWrapper = getJson as SongWrapper;
    console.log(`Song removed: ${stringifySong(songWrapper)}`);

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

    const songWrapper = json.songWrapper as SongWrapper;
    console.log(`Now playing: ${stringifySong(songWrapper)}`);
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

export async function captureSong(args: Argument[], flags: Flag[]): Promise<number> {
    const query = args[0]!.value as string;

    return await capture<Track>(
        query,
        searchTracks,
        "a song",
        (track) => `${track.album.artist.name} - ${track.name} (${track.album.name})`,
        async (track) => {
            return {
                success: true,
                value: track
            }
        }
    );
}

export async function captureAlbum(args: Argument[], flags: Flag[]): Promise<number> {
    const query = args[0]!.value as string;

    return await capture<Album>(
        query,
        searchAlbums,
        "an album",
        (album) => `${album.artist.name} - ${album.name}`,
        tracksFromAlbum
    );
}

export async function captureArtist(args: Argument[], flags: Flag[]): Promise<number> {
    const query = args[0]!.value as string;

    return await capture<Artist>(
        query,
        searchArtists,
        "an artist",
        (artist) => artist.name,
        tracksFromArtist
    );
}

export async function pull(args: Argument[], flags: Flag[]): Promise<number> {
    const libraryResult = await get_library();
    const libraryJson = await libraryResult.json() as Record<string, any>;

    if (!libraryResult.ok) {
        console.error(`Failed to fetch library: ${libraryJson.error}`);
        return 1;
    }

    const library = libraryJson as Library;
    const toPull = library.songWrappers.filter(e => e.song.youtubeSource && !e.song.localSource);

    // Download songs
    reserveLines(Math.min(CONCURRENT_DOWNLOADS, toPull.length));

    await forEachConcurrent(toPull, CONCURRENT_DOWNLOADS, async (songWrapper, index) => {
        const songString = stringifySong(songWrapper);
        const spinner = createSpinner(`Downloading song: ${songString}`, index);
        const downloadResult = await downloadSong(songWrapper);

        if (!downloadResult.success) {
            spinner.fail(`${downloadResult.error}: ${songString}`);
            return;
        }

        // Update source
        const path = downloadResult.value as string;

        const newSongWrapper: SongWrapper = {
            ...songWrapper,
            song: {
                ...songWrapper.song,
                localSource: path
            }
        };

        const editResult = await put_librarySongs(newSongWrapper);
        const editJson = await editResult.json() as Record<string, any>;

        if (!editResult.ok) {
            spinner.fail(`Failed to edit song: ${editJson.localSource}`);
            return;
        }

        spinner.succeed(`Song downloaded: ${songString}`);
    });

    return 0;
}

export async function status(): Promise<number> {
    const result = await get_status();
    const json = await result.json() as Record<string, any>;

    if (!result.ok) {
        console.error(`Failed to get status: ${json.error}`);
        return 1;
    }

    const status = json as Status;

    if (status.playing) {
        console.log(stringifySong(status.songWrapper!));
    }

    return 0;
}
