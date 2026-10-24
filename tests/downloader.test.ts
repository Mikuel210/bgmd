import { describe, expect, setDefaultTimeout, test } from "bun:test";
import { sourceFromTrack } from "../src/cli/downloader";
import type { TrackMetadata } from "../src/cli/resolver";

setDefaultTimeout(120_000);

function getTrack(name: string, album: string, artist: string): TrackMetadata {
  return {
    id: 1,
    name,
    trackNumber: 1,
    discNumber: 1,
    album: {
      id: 1,
      name: album,
      artist: {
        id: 1,
        name: artist,
      },
    },
  };
}

describe("getVideos", () => {
  test("dandeless - transition", async () => {
    const result = await sourceFromTrack(getTrack("transition", "dsktp world", "dandeless"));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBeOneOf([
        "https://youtube.com/watch?v=ewB2ioKfipw",
        "https://youtube.com/watch?v=VUhtf8hxCBE",
        "https://youtube.com/watch?v=fl2TDjWKQGo",
      ]);
    }
  });

  test("Aloboi - Train's Coming", async () => {
    const result = await sourceFromTrack(getTrack("Train's Coming", "Just DnB Flips", "Aloboi"));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=H3tMtjOAa0s");
    }
  });

  test("Wintergatan - All Was Well", async () => {
    const result = await sourceFromTrack(
      getTrack("Marble Machine", "Marble Machine", "Wintergatan"),
    );
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBeOneOf([
        "https://youtube.com/watch?v=zxAHxirc-qM",
        "https://youtube.com/watch?v=jRC49qUCp9Y",
      ]);
    }
  });

  test("Wintergatan - Marble Machine", async () => {
    const result = await sourceFromTrack(
      getTrack("Marble Machine", "Marble Machine", "Wintergatan"),
    );
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=BPNBwoqsWZ4");
    }
  });

  test("Wilbur Soot - 10 Week Rule", async () => {
    const result = await sourceFromTrack(
      getTrack("10 Week Rule", "Mammalian Sighing Reflew", "Wilbur Soot"),
    );
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=g_-vpy8rK9k");
    }
  });
});
