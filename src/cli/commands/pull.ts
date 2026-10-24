import type { Argument, Flag } from "../framework/command";
import type { Song } from "../../core/library";
import { get_librarySongs, put_librarySongs } from "../connection";
import { createSpinner, reserveLines } from "../formatter";
import { CONCURRENT_DOWNLOADS } from "../../core/config";
import { forEachConcurrent } from "../../core/task";
import { stringifySong } from "../formatter";
import { downloadSong } from "../downloader";
import { styleText } from "node:util";

export async function pull(args: Argument[], flags: Flag[]): Promise<number> {
  const songsResult = await get_librarySongs();

  if (!songsResult.success) {
    console.error(`Failed to fetch library: ${songsResult.error}`);
    return 1;
  }

  const toPull = songsResult.value.filter((e) => e.youtubeSource && !e.localSource);

  // Download songs
  reserveLines(Math.min(CONCURRENT_DOWNLOADS, toPull.length));
  let successes = 0;
  let failures = 0;

  await forEachConcurrent(
    toPull,
    async (song, index) => {
      const songString = stringifySong(song, false);
      const spinner = createSpinner(`Downloading song: ${songString}`, index);
      const downloadResult = await downloadSong(song);

      if (!downloadResult.success) {
        spinner.fail(`${downloadResult.error}: ${songString}`);
        failures++;
        return;
      }

      // Update source
      const path = downloadResult.value as string;
      const newSong: Song = { ...song, localSource: path };
      const editResult = await put_librarySongs(newSong);

      if (!editResult.success) {
        spinner.fail(`Failed to edit song: ${editResult.error}`);
        failures++;
        return;
      }

      spinner.succeed(`Song downloaded: ${songString}`);
      successes++;
    },
    CONCURRENT_DOWNLOADS,
  );

  if (toPull.length > 1) {
    let success = styleText("green", `✔ ${successes}`);
    let failure = styleText("red", `✖ ${failures}`);
    console.log(`\n${toPull.length} tracks | ${success} | ${failure}`);
  }

  return 0;
}
