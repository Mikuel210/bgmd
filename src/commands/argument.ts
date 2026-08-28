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
    }
}
