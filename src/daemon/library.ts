import z from "zod"
import { load, save } from "../store"

const libraryFileName = "library.json"

const SongSource = z.enum({
    Local: 0,
    YouTube: 1
});

const SongState = z.enum({
    Captured: 0,
    Reviewed: 1
});

const SongSchema = z.object({
    name: z.string(),
    album: z.string(),
    artist: z.string(),
    source: SongSource,
    locator: z.string(),
    state: SongState,
    mood: z.record(z.string(), z.number()),
    tags: z.array(z.string())
});

const DimensionSchema = z.object({
    name: z.string(),
    min: z.number(),
    max: z.number()
});

const LibrarySchema = z.object({
    dimensions: z.array(DimensionSchema).default([]),
    songs: z.record(z.string(), SongSchema).default({})
});

export type Song = z.infer<typeof SongSchema>;
export type Library = z.infer<typeof LibrarySchema>;

function loadLibrary(): Promise<z.ZodSafeParseResult<Library>> {
    return load<Library>(libraryFileName, LibrarySchema);
}

function saveLibrary(library: Library): Promise<void> {
    return save<Library>(libraryFileName, library);
}

export { SongSchema, loadLibrary, saveLibrary }
