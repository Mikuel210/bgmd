import z from "zod"

// Schemas
export enum SongState {
    Captured = 0,
    Reviewed = 0
}

export const SongStateSchema = z.enum(SongState);

export const SongSchema = z.object({
    id: z.string(),
    name: z.string(),
    album: z.string(),
    artist: z.string(),
    discNumber: z.number().gt(0).default(1),
    trackNumber: z.number().gt(0).default(1),
    youtubeSource: z.string().optional(),
    localSource: z.string().optional(),
    state: SongStateSchema,
    mood: z.record(z.string(), z.number()),
    tags: z.array(z.string())
});

export const SongDataSchema = SongSchema.omit({ id: true });

export const DimensionSchema = z.object({
    name: z.string(),
    min: z.number(),
    max: z.number()
});

export const LibrarySchema = z.object({
    dimensions: z.array(DimensionSchema).default([]),
    songs: z.array(SongSchema).default([])
});

// Types
export type Song = z.infer<typeof SongSchema>;
export type SongData = z.infer<typeof SongDataSchema>;
export type Library = z.infer<typeof LibrarySchema>;

export type Status =
    | { playing: true, song: Song }
    | { playing: false }
