import type { Argument, Flag } from "./commands/command";
import type { Song } from "./daemon/library";
import { delete_librarySongs, get_library, get_librarySongs, get_play, get_stop } from "./connection";
import { searchAlbums, searchArtists, searchTracks, tracksFromAlbum, tracksFromArtist, type Album, type Artist, type Track } from "./resolver";
import { addSong, captureTrack, editSong } from "./helpers";
import { runWithConcurrency as forEachConcurrent } from "./task";

export async function root(args: Argument[], flags: Flag[]): Promise<number> {
    console.log("Usage: bgmctl <command> [<args>]");
    console.log("See: bgmctl --help");
    return 0;
}

function stringifySong(id: string, song: Song): string {
    return `[${id}] ${song.artist} - ${song.name} (${song.album})`;
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

    if (!addResult.success) {
        console.error(addResult.error);
        return 1;
    }

    const addJson = addResult.value as Record<string, any>;
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

    // Edit song
    const editResult = await editSong(id, song);

    if (!editResult.success) {
        console.error(editResult.error);
        return 1;
    }

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
        const getJson = await getResult.json() as Record<string, any>;
        console.error(`Failed to remove song: ${getJson.error}`);

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

export async function captureSong(args: Argument[], flags: Flag[]): Promise<number> {
    // Search song
    const query = args[0]!.value as string;
    const searchResult = await searchTracks(query);

    if (!searchResult.success) {
        console.error(searchResult.error);
        return 1;
    }

    const tracks = searchResult.value as Track[];

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]!;
        console.log(`${i + 1}. ${track.album.artist.name} - ${track.name} (${track.album.name})`);
    }

    // Validate input
    const range = `(1 - ${tracks.length}):`;
    const input = prompt(`\nSelect a song to add ${range}`) ?? "";
    let number;

    try {
        number = parseInt(input);
    } catch {
        console.error(`Value must be a number ${range}`);
        return 1;
    }

    // Validate range
    if (number < 1) {
        console.error("Value must be greater than 0");
        return 1;
    }

    if (number > tracks.length) {
        console.error(`Value must be lower than ${tracks.length + 1}`);
        return 1;
    }

    const track = tracks[number - 1]!;

    // Capture song
    console.log(`Capturing song: ${track.album.artist.name} - ${track.name}`);
    const captureResult = await captureTrack(track);

    if (!captureResult.success) {
        console.error(captureResult);
        return 1;
    }

    const captureJson = captureResult.value as Record<string, any>;
    console.log(`Song captured: ${stringifySong(captureJson.id, captureJson.song)}`);

    return 0;
}

export async function captureAlbum(args: Argument[], flags: Flag[]): Promise<number> {
    // Search album
    const query = args[0]!.value as string;
    const searchResult = await searchAlbums(query);

    if (!searchResult.success) {
        console.error(searchResult.error);
        return 1;
    }

    const albums = searchResult.value as Album[];

    for (let i = 0; i < albums.length; i++) {
        const album = albums[i]!;
        console.log(`${i + 1}. ${album.artist.name} - ${album.name}`);
    }

    // Validate input
    const range = `(1 - ${albums.length})`;
    const input = prompt(`\nSelect an album to add ${range}:`) ?? "";
    let number;

    try {
        number = parseInt(input);
    } catch (e) {
        console.error(`Value must be a number ${range}`);
        return 1;
    }

    // Validate range
    if (number < 1) {
        console.error("Value must be greater than 0");
        return 1;
    }

    if (number > albums.length) {
        console.error(`Value must be lower than ${albums.length + 1}`);
        return 1;
    }

    const album = albums[number - 1]!;

    // Fetch tracks
    const tracksResult = await tracksFromAlbum(album);

    if (!tracksResult.success) {
        console.error(tracksResult.error);
        return 1;
    }

    const tracks = tracksResult.value as Track[];

    // Capture songs
    await forEachConcurrent(tracks, 3, async (track) => {
        console.log(`Capturing song: ${track.album.artist.name} - ${track.name}`);
        const captureResult = await captureTrack(track);

        if (!captureResult.success) {
            console.error(`${track.name}: ${captureResult.error}`);
            return;
        }

        const captureJson = captureResult.value as Record<string, any>;
        console.log(`Song captured: ${stringifySong(captureJson.id, captureJson.song)}`);
    });

    return 0;
}

export async function captureArtist(args: Argument[], flags: Flag[]): Promise<number> {
    // Search album
    const query = args[0]!.value as string;
    const searchResult = await searchArtists(query);

    if (!searchResult.success) {
        console.error(searchResult.error);
        return 1;
    }

    const artists = searchResult.value as Artist[];

    for (let i = 0; i < artists.length; i++) {
        const artist = artists[i]!;
        console.log(`${i + 1}. ${artist.name}`);
    }

    // Validate input
    const range = `(1 - ${artists.length})`;
    const input = prompt(`\nSelect an artist to add ${range}:`) ?? "";
    let number;

    try {
        number = parseInt(input);
    } catch (e) {
        console.error(`Value must be a number ${range}`);
        return 1;
    }

    // Validate range
    if (number < 1) {
        console.error("Value must be greater than 0");
        return 1;
    }

    if (number > artists.length) {
        console.error(`Value must be lower than ${artists.length + 1}`);
        return 1;
    }

    const artist = artists[number - 1]!;

    // Fetch tracks
    const tracksResult = await tracksFromArtist(artist);

    if (!tracksResult.success) {
        console.error(tracksResult.error);
        return 1;
    }

    const tracks = tracksResult.value as Track[];

    // Capture songs
    await forEachConcurrent(tracks, 3, async (track) => {
        console.log(`Capturing song: ${track.album.artist.name} - ${track.name}`);
        const captureResult = await captureTrack(track);

        if (!captureResult.success) {
            console.error(`${track.name}: ${captureResult.error}`);
            return;
        }

        const captureJson = captureResult.value as Record<string, any>;
        console.log(`Song captured: ${stringifySong(captureJson.id, captureJson.song)}`);
    });

    return 0;
}
