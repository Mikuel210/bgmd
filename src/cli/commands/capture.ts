import { searchAlbums, searchArtists, searchTracks, tracksFromAlbum, tracksFromArtist, type Album, type Artist, type Track } from "../resolver";
import { SongState, type Song, type SongData } from "../../core/library";
import { forEachConcurrent, type Result } from "../../core/task";
import type { Argument, Flag } from "../framework/command";
import { createSpinner, reserveLines, stringifySong } from "../formatter";
import { post_librarySongs } from "../connection";
import { CONCURRENT_TASKS } from "../../core/config";
import { sourceFromTrack } from "../downloader";

interface Name {
    name: string
}

async function captureTrack(track: Track): Promise<Result<Song>> {
    const sourceResult = await sourceFromTrack(track);

    if (!sourceResult.success) {
        return {
            success: false,
            error: `Failed to fetch track source: ${sourceResult.error}`
        };
    }

    const url = sourceResult.value as string;

    const data: SongData = {
        name: track.name,
        album: track.album.name,
        artist: track.album.artist.name,
        discNumber: track.discNumber,
        trackNumber: track.trackNumber,
        youtubeSource: url,
        state: SongState.Captured,
        mood: {},
        tags: []
    };

    const addResult = await post_librarySongs(data, true);

    if (!addResult.success) {
        return {
            success: false,
            error: `Failed to add song: ${addResult.error}`
        };
    }

    return {
        success: true,
        value: addResult.value
    };
}

async function capture<T extends Name>(
    query: string,
    search: (query: string) => Promise<Result<T[]>>,
    promptName: string,
    stringify: (entry: T) => string,
    getTracks: (entry: T) => Promise<Result<Track[]>>)
    : Promise<number>
{
    const searchResult = await search(query);

    if (!searchResult.success) {
        console.error(searchResult.error);
        return 1;
    }

    // Check for exact match
    const entries = searchResult.value;
    let matches = entries.filter(e => e.name.toLowerCase().trim() == query.toLowerCase().trim());
    let match: T;

    if (entries.length == 0) {
        console.error("No matches found");
        return 1;
    } else if (matches.length == 1) {
        match = matches[0]!;
    } else {
        // Prompt options
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]!;
            console.log(`${i + 1}. ${stringify(entry)}`);
        }

        const range = `(1 - ${entries.length})`;
        const input = prompt(`\nSelect ${promptName} to add ${range}:`) ?? "";
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

        if (number > entries.length) {
            console.error(`Value must be lower than ${entries.length + 1}`);
            return 1;
        }

        match = entries[number - 1]!;
    }

    // Fetch tracks
    const tracksResult = await getTracks(match);

    if (!tracksResult.success) {
        console.error(tracksResult.error);
        return 1;
    }

    const tracks = tracksResult.value;

    // Capture songs
    reserveLines(Math.min(CONCURRENT_TASKS, tracks.length));

    await forEachConcurrent(tracks, async (track, index) => {
        const spinner = createSpinner(`Capturing song: ${track.name}`, index);
        const captureResult = await captureTrack(track);

        if (!captureResult.success) {
            spinner.fail(`${captureResult.error}: ${track.name}`);
            return;
        }

        spinner.succeed(`Song captured: ${stringifySong(captureResult.value)}`);
    });

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
                value: [track]
            };
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
