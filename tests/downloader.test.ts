import { describe, expect, setDefaultTimeout, test } from "bun:test";
import { sourceFromTrack } from "../src/cli/downloader";
import type { TrackMetadata } from "../src/cli/resolver";

setDefaultTimeout(1_000_000);

/*
failed to search: disappointment (and weird order in album too)
failed to capture: me
"track number already exists" should only warn
*/

function getTrack(name: string, artist: string): TrackMetadata {
  return {
    id: 1,
    name,
    trackNumber: 1,
    discNumber: 1,
    album: {
      id: 1,
      name: "",
      artist: {
        id: 1,
        name: artist,
      },
    },
  };
}

describe("getVideos", () => {
  test("dandeless - transition", async () => {
    const result = await sourceFromTrack(getTrack("transition", "dandeless"));
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
    const result = await sourceFromTrack(getTrack("Train's Coming", "Aloboi"));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=H3tMtjOAa0s");
    }
  });

  test("Wintergatan - All Was Well", async () => {
    const result = await sourceFromTrack(getTrack("All Was Well", "Wintergatan"));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBeOneOf([
        "https://youtube.com/watch?v=zxAHxirc-qM",
        "https://youtube.com/watch?v=jRC49qUCp9Y",
      ]);
    }
  });

  test("Wintergatan - Marble Machine", async () => {
    const result = await sourceFromTrack(getTrack("Marble Machine", "Wintergatan"));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=BPNBwoqsWZ4");
    }
  });

  test("Wilbur Soot - 10 Week Rule", async () => {
    const result = await sourceFromTrack(getTrack("10 Week Rule", "Wilbur Soot"));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=g_-vpy8rK9k");
    }
  });

  test("Taylor Swift - Patient Zero", async () => {
    const result = await sourceFromTrack(getTrack("Patient Zero", "Taylor Swift"));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=BpR280fXISA");
    }
  });
});
