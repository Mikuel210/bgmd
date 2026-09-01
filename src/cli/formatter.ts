import type { Album, Song } from "../core/library";
import spinners from "unicode-animations";
import { styleText } from "node:util";
import type { Result } from "../core/task";
import Fuse from "fuse.js";

export function stringifySong(song: Song): string {
    return `[${song.id}] ${song.artist} - ${song.name} (${song.album})`;
}

export function stringifyAlbum(album: Album): string {
    const tracks = `${album.songs.length} track${album.songs.length == 1 ? '' : 's'}`;
    return `${album.artist} - ${album.name} (${tracks})`;
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
    promptName: string)
    : Promise<Result<T>>
{
    let matches = entries.filter(e => e.name.toLowerCase().trim() == query.toLowerCase().trim());

    if (entries.length == 0) {
        return {
            success: false,
            error: "No matches found"
        };
    } else if (matches.length == 1) {
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
        const input = prompt(`\nSelect ${promptName} to add ${range}:`) ?? "";
        let number;

        try {
            number = parseInt(input);
        } catch (e) {
            return {
                success: false,
                error: `Value must be a number ${range}`
            };
        }

        // Validate range
        if (number < 1) {
            return {
                success: false,
                error: "Value must be greater than 0"
            };
        }

        if (number > entries.length) {
            return {
                success: false,
                error: `Value must be lower than ${entries.length + 1}`
            };
        }

        return {
            success: true,
            value: entries[number - 1]!
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
