import { get_library } from "../connection";
import type { Library, Song } from "../daemon/library";
import type { ValidateResponse } from "./command";

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

function isAudioFile(path: string): boolean {
    const audioExtensions = [
        '.mp3', '.wav', '.ogg', '.flac', '.aac',
        '.m4a', '.opus', '.webm', '.oga', '.wma'
    ];

    return audioExtensions.some(e => path.toLowerCase().endsWith(e));
}

function cleanYouTubeUrl(input: string): string | null {
    const httpPrefixes = ["https://www.", "https://", "http://www.", "http://"];
    const youtubePrefixes = ["youtube.com/watch?v=", "youtu.be/"];
    let isYouTubeUrl = false;
    let videoId = input;

    // Remove HTTP and YouTube prefixes
    for (const prefix of httpPrefixes) {
        if (!videoId.startsWith(prefix)) continue;
        videoId = videoId.slice(prefix.length);
    }

    for (const prefix of youtubePrefixes) {
        if (!videoId.startsWith(prefix)) continue;

        videoId = videoId.slice(prefix.length);
        isYouTubeUrl = true;
    }

    // Remove additional search parameters
    const index1 = videoId.indexOf('?');
    const index2 = videoId.indexOf('&')
    if (index1 != -1) videoId = videoId.substring(0, index1);
    if (index2 != -1) videoId = videoId.substring(0, index2);

    // Return clean URL
    if (videoId != input && isYouTubeUrl)
        return `https://youtube.com/watch?v=${videoId}`;

    return null;
}

export async function validateSongSource(input: string): Promise<ValidateResponse> {
    // Validate file path
    const file = Bun.file(input);

    if (await file.exists()) {
        if (isAudioFile(input)) {
            return {
                success: true,
                value: input
            };
        }

        return {
            success: false,
            error: "Path must be an audio file"
        }
    }

    // Validate and clean YouTube URL
    const url = cleanYouTubeUrl(input);

    if (url) {
        return {
            success: true,
            value: url
        };
    }

    return {
        success: false,
        error: "File or YouTube video not found"
    };
}
