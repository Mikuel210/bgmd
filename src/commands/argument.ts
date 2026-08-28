import { get_library } from "../connection"
import type { Library, Song } from "../daemon/library";

export interface ValidateResponse {
    success: boolean,
    value?: any,
    error?: string
}

export interface Argument {
    name: string,
    description: string,
    params: boolean,
    validate: (input: string) => Promise<ValidateResponse>
    value?: any,
}

export async function validateAddSong(input: string): Promise<ValidateResponse> {
    const response = await get_library();
    const json = await response.json() as Record<string, any>;

    if (response.status != 200) {
        return {
            success: false,
            error: json.error
        };
    }

    const library = json.data as Library;
    const songs = Object.values(library.songs);

    if (songs.some(e => e.name == input)) {
        return {
            success: false,
            error: `Song already exists: ${input}`
        };
    }

    return {
        success: true,
        value: input
    };
}
