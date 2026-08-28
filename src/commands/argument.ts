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

export async function validateString(input: string): Promise<ValidateResponse> {
    return {
        success: true,
        value: input
    };
}

export async function validateSongId(input: string): Promise<ValidateResponse> {
    const response = await get_library();
    const json = await response.json() as Record<string, any>;

    if (!response.ok) {
        return {
            success: false,
            error: json.error
        };
    }

    const library = json as Library;
    const songs = library.songs as Record<string, Song>;

    if (input in songs) {
        return {
            success: true,
            value: input
        }
    }

    return {
        success: false,
        error: "Song ID not found"
    }
}
