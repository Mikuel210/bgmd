import type { Argument, Flag } from "../framework/command";
import type { Song } from "../../core/library";
import { get_library, put_librarySongs } from "../connection";
import { createSpinner, reserveLines } from "../formatter";
import { forEachConcurrent } from "../../core/task";
import { stringifySong } from "../formatter";
import { downloadSong } from "../downloader";

const CONCURRENT_DOWNLOADS = 5;

export async function pull(args: Argument[], flags: Flag[]): Promise<number> {
    const libraryResult = await get_library();

    if (!libraryResult.success) {
        console.error(`Failed to fetch library: ${libraryResult.error}`);
        return 1;
    }

    const toPull = libraryResult.value.songs.filter(e => e.youtubeSource && !e.localSource);

    // Download songs
    reserveLines(Math.min(CONCURRENT_DOWNLOADS, toPull.length));

    await forEachConcurrent(toPull, async (song, index) => {
        const songString = stringifySong(song);
        const spinner = createSpinner(`Downloading song: ${songString}`, index);
        const downloadResult = await downloadSong(song);

        if (!downloadResult.success) {
            spinner.fail(`${downloadResult.error}: ${songString}`);
            return;
        }

        // Update source
        const path = downloadResult.value as string;
        const newSong: Song = { ...song, localSource: path };
        const editResult = await put_librarySongs(newSong);

        if (!editResult.success) {
            spinner.fail(`Failed to edit song: ${editResult.error}`);
            return;
        }

        spinner.succeed(`Song downloaded: ${songString}`);
    }, CONCURRENT_DOWNLOADS);

    return 0;
}
