import type { Album, Artist, Song, Status } from "../core/library";
import { MAX_QUEUE_ITEMS } from "../core/config";
import { styleText } from "node:util";

export const DARK_TEAL = "#80CBC4";
export const DARK_GREY = "#9E9E9E";
export const LIGHT_GREY = "#BDBDBD";

export function logStatus(status: Status, showQueue: boolean = true): void {
  if (!status.playing) {
    console.log("Nothing playing");
    return;
  }

  console.log(`${status.paused ? "Paused" : "Now playing"}: ${stringifySong(status.song)}`);
  if (status.queue.length == 0 || !showQueue) return;

  console.log("\nQueue:");

  for (let i = 0; i < Math.min(status.queue.length, MAX_QUEUE_ITEMS); i++) {
    const song = status.queue[i]!;
    console.log(`  [${i + 1}] ${song.trackNumber}. ${stringifySong(song)}`);
  }

  if (status.queue.length > MAX_QUEUE_ITEMS) console.log("  (...)");
}

export function logTracksResult(successes: number, failures: number, warnings: number) {
  const total = successes + failures + warnings;
  let success = successes > 0 ? styleText("green", `✔ ${successes}`) : `✔ ${successes}`;
  let failure = failures > 0 ? styleText("red", `✖ ${failures}`) : `✖ ${failures}`;
  let warning = warnings > 0 ? styleText("yellow", `⚠ ${warnings}`) : `⚠ ${warnings}`;

  console.log(`\n${total} track${total == 1 ? "" : "s"} | ${success} | ${failure} | ${warning}`);
}

export function stringifySong(song: Song, colors: boolean = true): string {
  const id = colors ? styleText(DARK_GREY, `[${song.id}]`) : `[${song.id}]`;
  const album = colors ? styleText(LIGHT_GREY, `(${song.album})`) : `(${song.album})`;
  return `${id} ${song.artist} - ${song.name} ${album}`;
}

export function stringifyAlbum(album: Album): string {
  const tracks = `${album.songs.length} track${album.songs.length == 1 ? "" : "s"}`;
  return `${album.artist} - ${album.name} ${styleText(DARK_GREY, `(${tracks})`)}`;
}

export function stringifyArtist(artist: Artist): string {
  const albums = `${artist.albums.length} album${artist.albums.length == 1 ? "" : "s"}`;
  return `${artist.name} ${styleText(DARK_GREY, `(${albums})`)}`;
}

export function formatMs(input: number): string {
  const seconds = Math.floor((input / 1000) % 60);
  const minutes = Math.floor((input / 1000 / 60) % 60);
  const hours = Math.floor(input / 1000 / 60 / 60);

  return (
    (hours > 0 ? String(hours).padStart(2, "0") + ":" : "") +
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  );
}
