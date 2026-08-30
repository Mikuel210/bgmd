import z from "zod"
import { load, save } from "../store"

const LIBRARY_FILENAME = "library.json"

const SongState = z.enum({
    Captured: 0,
    Reviewed: 1
});

export const SongSchema = z.object({
    name: z.string(),
    album: z.string(),
    artist: z.string(),
    discNumber: z.number().gt(0).default(1),
    trackNumber: z.number().gt(0).default(1),
    youtubeSource: z.string().optional(),
    localSource: z.string().optional(),
    state: SongState,
    mood: z.record(z.string(), z.number()),
    tags: z.array(z.string())
});

export const DimensionSchema = z.object({
    name: z.string(),
    min: z.number(),
    max: z.number()
});

export const LibrarySchema = z.object({
    dimensions: z.array(DimensionSchema).default([]),
    songs: z.record(z.string(), SongSchema).default({})
});

export type Song = z.infer<typeof SongSchema>;
export type Library = z.infer<typeof LibrarySchema>;

export function loadLibrary(): Promise<z.ZodSafeParseResult<Library>> {
    return load<Library>(LIBRARY_FILENAME, LibrarySchema);
}

export function saveLibrary(library: Library): Promise<void> {
    return save<Library>(LIBRARY_FILENAME, library);
}
