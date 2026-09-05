import type { Album, Artist, Song, Status } from "../core/library";
import type { Result } from "../core/task";
import { validatePositiveInteger } from "./framework/validate";
import { MAX_QUEUE_ITEMS } from "../core/config";
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

export function logStatus(status: Status): void {
    if (!status.playing) {
        console.log("Nothing playing");
        return;
    }

    console.log(`Now playing: ${stringifySong(status.song)}`);
    if (status.queue.length == 0) return;

    console.log("\nQueue:");

    for (let i = 0; i < Math.min(status.queue.length, MAX_QUEUE_ITEMS); i++) {
        const song = status.queue[i]!;
        console.log(`  [${i + 1}] ${song.trackNumber}. ${stringifySong(song)}`)
    }

    if (status.queue.length > MAX_QUEUE_ITEMS)
        console.log("  (...)");
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
    const fuse = new Fuse(entries, {
        keys,
        threshold: 0.4,
        ignoreLocation: true,
        ignoreDiacritics: true,
        findAllMatches: true,
    });

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
    query = query.trim().toLowerCase();
    const matches = entries.filter(e => e.name.trim().toLowerCase() == query);

    if (entries.length == 0) {
        // No matches
        return {
            success: false,
            error: "No matches found"
        };
    } else if (matches.length == 1 && matches[0] === entries[0]) {
        // Perfect match
        return {
            success: true,
            value: matches[0]!
        };
    } else if (entries.length > 1) {
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
    } else {
        // Single entry
        const entry = entries[0]!;
        console.log(stringify(entry));

        let input = prompt(`Select this item? (Y/n): `) ?? "";
        input = input.trim().toLowerCase();

        if (['y', 'yes'].includes(input)) {
            console.log();

            return {
                success: true,
                value: entry
            };
        }

        if (['n', 'no'].includes(input)) {
            return {
                success: false,
                error: "Operation cancelled"
            };
        }

        return {
            success: false,
            error: "Value must be y/n"
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
