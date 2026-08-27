import z from "zod"
import path from "node:path"
import { configPath, load, save } from "../store"

const libraryPath = path.join(configPath, "library.json")

const SongSource = z.enum({
    Local: 0,
    YouTube: 1
});

const SongState = z.enum({
    Captured: 0,
    Reviewed: 1
});

const SongSchema = z.object({
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
    dimensions: z.array(DimensionSchema),
    songs: z.array(SongSchema)
});

type Song = z.infer<typeof SongSchema>;
type Library = z.infer<typeof LibrarySchema>;

function newLibrary(): Library {
    return { dimensions: [], songs: [] }
}

function loadLibrary(): Promise<Library> {
    return load<Library>(libraryPath, SongSchema);
}

function saveLibrary(library: Library): Promise<void> {
    return save<Library>(libraryPath, library);
}

async function addSong(song: Song): Promise<void> {
    const library = await loadLibrary();
    library.songs.push(song);

    await saveLibrary(library);
}

export { SongSchema, loadLibrary, saveLibrary, addSong }
