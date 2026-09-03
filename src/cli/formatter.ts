import type { Album, Artist, Song } from "../core/library";
import type { Result } from "../core/task";
import { validatePositiveInteger } from "./framework/validate";
import { styleText } from "node:util";
import spinners from "unicode-animations";
import Fuse from "fuse.js";

export const DARK_TEAL = "#80CBC4";
export const DARK_GREY = "#9E9E9E";
export const LIGHT_GREY = "#BDBDBD";
const EXTRA_SPACES = 3;

export function logObject(object: Record<string, any>, indented: boolean = false): void {
    const spaces = Math.max(...Object.keys(object).map(e => e.length)) + EXTRA_SPACES;

    for (let key of Object.keys(object)) {
        let value = object[key]!;
        const space = ' '.repeat(spaces - key.length);

        if (indented)
            console.log(`  ${key}${space}${value}`);
        else
            console.log(`${styleText(DARK_TEAL, key)}${space}${value}`);
    }
}

export function stringifySong(song: Song, colors: boolean = true): string {
    const id = colors ? styleText(DARK_GREY, `[${song.id}]`) : `[${song.id}]`;
    const album = colors ? styleText(LIGHT_GREY, `(${song.album})`) : `(${song.album})`;
    return `${id} ${song.artist} - ${song.name} ${album}`;
}

export function stringifyAlbum(album: Album): string {
    const tracks = `${album.songs.length} track${album.songs.length == 1 ? '' : 's'}`;
    return `${album.artist} - ${album.name} ${styleText(DARK_GREY, `(${tracks})`)}`;
}

export function stringifyArtist(artist: Artist): string {
    const albums = `${artist.albums.length} album${artist.albums.length == 1 ? '' : 's'}`;
    return `${artist.name} ${styleText(DARK_GREY, `(${albums})`)}`;
}

// Prompt options
export function fuzzySearch<T>(entries: T[], keys: string[], query: string, limit: number): T[] {
    const fuse = new Fuse(entries, { keys });
    const matches = fuse.search(query).map(e => e.item);

    matches.splice(limit);
    return matches;
}

export async function promptOptions<T extends { name: string }>(
    entries: T[],
    query: string,
    stringify: (entry: T) => string,
    promptText: string)
    : Promise<Result<T>>
{
    const matches = entries.filter(e => e.name.toLowerCase().trim() == query.toLowerCase().trim());

    if (entries.length == 0) {
        return {
            success: false,
            error: "No matches found"
        };
    } else if (entries.length == 1) {
        return {
            success: true,
            value: entries[0]!
        };
    } else if (matches.length == 1 && matches[0] === entries[0]) {
        return {
            success: true,
            value: matches[0]!
        };
    } else {
        // Prompt options
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]!;
            console.log(`${i + 1}. ${stringify(entry)}`);
        }

        const range = `(1 - ${entries.length})`;
        const input = prompt(`\nSelect ${promptText} ${range}:`) ?? "";

        let numberResult = await validatePositiveInteger(input);
        if (!numberResult.success) return numberResult;

        // Validate range
        if (numberResult.value > entries.length) {
            return {
                success: false,
                error: `Value must be lower than ${entries.length + 1}`
            };
        }

        console.log();

        return {
            success: true,
            value: entries[numberResult.value - 1]!
        };
    }
}


// Task spinners
let reservedLines = 0;

function hideCursor() {
    process.stdout.write("\x1b[?25l");
}

function showCursor() {
    process.stdout.write("\x1b[?25h");
}

export function reserveLines(amount: number) {
    hideCursor();
    reservedLines = amount;
    process.stdout.write('\n'.repeat(amount));
}

export function createSpinner(message: string, index: number) {
    const { frames, interval } = spinners.braille;
    let frameIndex = 0;
    let text = message;

    function writeLine(content: string) {
        if (index >= reservedLines) {
            const difference = index - reservedLines + 1;
            reservedLines += difference;
            process.stdout.write('\n'.repeat(difference));
        }

        process.stdout.write(`\x1b[${reservedLines - index}A`);
        process.stdout.write(`\r\x1b[K  ${content}`);
        process.stdout.write(`\x1b[${reservedLines - index}B`);
    }

    const timer = setInterval(() => {
        writeLine(`${frames[frameIndex++ % frames.length]} ${text}`);
    }, interval);

    return {
        update(message: string) { text = message; },
        succeed(message: string) { clearInterval(timer); writeLine(styleText("green", `✔ ${message}`)); },
        fail(message: string) { clearInterval(timer); writeLine(styleText("red", `✖ ${message}`)); }
    };
}

// Make sure cursor is shown on exit
process.on("exit", showCursor);
process.on("SIGINT", () => { showCursor(); process.exit(130); });
