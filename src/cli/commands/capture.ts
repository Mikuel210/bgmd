import {
  searchAlbums,
  searchArtists,
  searchTracks,
  tracksFromAlbum,
  tracksFromArtist,
  type AlbumMetadata,
  type ArtistMetadata,
  type TrackMetadata,
} from "../resolver";

import { createSpinner, promptOptions, reserveLines, stringifySong } from "../formatter";
import { SongState, type Song, type SongData } from "../../core/library";
import { forEachConcurrent, type Result } from "../../core/task";
import type { Argument, Flag } from "../framework/command";
import { post_librarySongs, post_librarySongsValidate } from "../connection";
import { CONCURRENT_TASKS } from "../../core/config";
import { sourceFromTrack } from "../downloader";

async function captureTrack(track: TrackMetadata): Promise<Result<Song>> {
  let data: SongData = {
    name: track.name,
    album: track.album.name,
    artist: track.album.artist.name,
    discNumber: track.discNumber,
    trackNumber: track.trackNumber,
    state: SongState.Captured,
    mood: {},
    tags: [],
  };

  // Validate result first to check for errors faster
  const validateResult = await post_librarySongsValidate(data);

  if (!validateResult.success) {
    return {
      success: false,
      error: `Failed to validate song: ${validateResult.error}`,
    };
  }

  // Get YouTube source
  const sourceResult = await sourceFromTrack(track);

  if (!sourceResult.success) {
    return {
      success: false,
      error: `Failed to fetch source: ${sourceResult.error}`,
    };
  }

  data = { ...data, youtubeSource: sourceResult.value };

  // Add song
  const addResult = await post_librarySongs(data, true);

  if (!addResult.success) {
    return {
      success: false,
      error: `Failed to add song: ${addResult.error}`,
    };
  }

  return {
    success: true,
    value: addResult.value,
  };
}

async function capture<T extends { name: string }>(
  query: string,
  search: (query: string) => Promise<Result<T[]>>,
  stringify: (entry: T) => string,
  getTracks: (entry: T) => Promise<Result<TrackMetadata[]>>,
  pronoun: string,
  itemName: string,
): Promise<number> {
  const searchResult = await search(query);

  if (!searchResult.success) {
    console.error(searchResult.error);
    return 1;
  }

  // Get chosen option
  const matchResult = await promptOptions(searchResult.value, query, stringify, pronoun, itemName);

  if (!matchResult.success) {
    console.error(matchResult.error);
    return 1;
  }

  // Fetch tracks
  const tracksResult = await getTracks(matchResult.value);

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

    spinner.succeed(`Song captured: ${stringifySong(captureResult.value, false)}`);
  });

  return 0;
}

export async function captureSong(args: Argument[], flags: Flag[]): Promise<number> {
  const query = args[0]!.value as string;

  return await capture<TrackMetadata>(
    query,
    searchTracks,
    (track) => `${track.album.artist.name} - ${track.name} (${track.album.name})`,
    async (track) => {
      return {
        success: true,
        value: [track],
      };
    },
    "a",
    "song",
  );
}

export async function captureAlbum(args: Argument[], flags: Flag[]): Promise<number> {
  const query = args[0]!.value as string;

  return await capture<AlbumMetadata>(
    query,
    searchAlbums,
    (album) => `${album.artist.name} - ${album.name}`,
    tracksFromAlbum,
    "a",
    "song",
  );
}

export async function captureArtist(args: Argument[], flags: Flag[]): Promise<number> {
  const query = args[0]!.value as string;

  return await capture<ArtistMetadata>(
    query,
    searchArtists,
    (artist) => artist.name,
    tracksFromArtist,
    "an",
    "artist",
  );
}
