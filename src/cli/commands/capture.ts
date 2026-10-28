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

import {
  createSpinner,
  logTracksResult,
  promptOptions,
  reserveLines,
  stringifySong,
} from "../formatter";

import { forEachConcurrent, WarningState, type Result, type WarningResult } from "../../core/task";
import { SongState, type Song, type SongData } from "../../core/library";
import type { Argument, Flag } from "../framework/command";
import { post_librarySongs, post_librarySongsValidate } from "../connection";
import { CONCURRENT_TASKS } from "../../core/config";
import { sourceFromTrack } from "../downloader";

async function captureTrack(track: TrackMetadata): Promise<WarningResult<Song>> {
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
      state: WarningState.Warning,
      message: validateResult.error,
    };
  }

  // Get YouTube source
  const sourceResult = await sourceFromTrack(track);

  if (!sourceResult.success) {
    return {
      state: WarningState.Failure,
      error: sourceResult.error,
    };
  }

  data = { ...data, youtubeSource: sourceResult.value };

  // Add song
  const addResult = await post_librarySongs(data, true);

  if (!addResult.success) {
    return {
      state: WarningState.Failure,
      error: addResult.error,
    };
  }

  return {
    state: WarningState.Success,
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
  let results: WarningResult<Song>[] = [];

  await forEachConcurrent(tracks, async (track, index) => {
    const spinner = createSpinner(`Capturing song: ${track.name}`, index);
    const captureResult = await captureTrack(track);
    results.push(captureResult);

    switch (captureResult.state) {
      case WarningState.Success:
        spinner.succeed(`Song captured: ${stringifySong(captureResult.value, false)}`);
        break;

      case WarningState.Warning:
        spinner.warn(`${captureResult.message}: ${track.name}`);
        break;

      case WarningState.Failure:
        spinner.fail(`${captureResult.error}: ${track.name}`);
        break;
    }
  });

  logTracksResult(
    results.filter((e) => e.state == WarningState.Success).length,
    results.filter((e) => e.state == WarningState.Failure).length,
    results.filter((e) => e.state == WarningState.Warning).length,
  );

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
    "an",
    "album",
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
