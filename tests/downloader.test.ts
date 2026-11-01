import { describe, expect, setDefaultTimeout, test } from "bun:test";
import { sourceFromTrack } from "../src/cli/downloader";
import type { TrackMetadata } from "../src/cli/resolver";

setDefaultTimeout(1_000_000);

/*
TODO
failed to search: disappointment (and weird order in album too)
i think minecraft had wrong audios?
*/

function getTrack(name: string, artist: string, durationMs: number): TrackMetadata {
  return {
    id: 1,
    name,
    trackNumber: 1,
    discNumber: 1,
    durationMs: durationMs,
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
    const result = await sourceFromTrack(getTrack("transition", "dandeless", 117266));
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
    const result = await sourceFromTrack(getTrack("Train's Coming", "Aloboi", 101647));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=H3tMtjOAa0s");
    }
  });

  test("Wintergatan - All Was Well", async () => {
    const result = await sourceFromTrack(getTrack("All Was Well", "Wintergatan", 183223));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBeOneOf([
        "https://youtube.com/watch?v=zxAHxirc-qM",
        "https://youtube.com/watch?v=jRC49qUCp9Y",
      ]);
    }
  });

  test("Wintergatan - Marble Machine", async () => {
    const result = await sourceFromTrack(getTrack("Marble Machine", "Wintergatan", 243783));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=IvUU8joBb1Q");
    }
  });

  test("Wilbur Soot - 10 Week Rule", async () => {
    const result = await sourceFromTrack(getTrack("10 Week Rule", "Wilbur Soot", 165560));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=g_-vpy8rK9k");
    }
  });

  test("Imaginative Prompting - The End Of The Show", async () => {
    const result = await sourceFromTrack(
      getTrack("The End Of The Show", "Imaginative Prompting", 359934),
    );
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=tKrVYOUvrtA");
    }
  });

  test("Fleetwood Mac - Second Hand News", async () => {
    const result = await sourceFromTrack(getTrack("Second Hand News", "Fleetwood Mac", 176307));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBeOneOf([
        "https://youtube.com/watch?v=SLlYUlS_Awo",
        "https://youtube.com/watch?v=bLfcwDZ5GzQ",
      ]);
    }
  });

  test("Taylor Swift - Patient Zero", async () => {
    const result = await sourceFromTrack(getTrack("Patient Zero", "Taylor Swift", 225868));
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBe("https://youtube.com/watch?v=BpR280fXISA");
    }
  });
});
