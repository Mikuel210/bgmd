import { styleText } from "node:util";
import spinners from "unicode-animations";

export interface TaskResult {
    success: boolean,
    value?: any,
    error?: string
}

export async function forEachConcurrent<T>(items: T[], limit: number, task: (item: T, index: number) => Promise<void>): Promise<void> {
    let index = 0;

    async function worker() {
        while (index < items.length) {
            const current = items[index++]!;
            await task(current, index - 1);
        }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
    await Promise.all(workers);
}


// Task progress
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
            reservedLines++;
            process.stdout.write('\n');
        }

        process.stdout.write(`\x1b[${reservedLines - index}A`);
        process.stdout.write(`\r\x1b[K${content}`);
        process.stdout.write(`\x1b[${reservedLines - index}B`);
    }

    const timer = setInterval(() => {
        writeLine(`  ${frames[frameIndex++ % frames.length]} ${text}`);
    }, interval);

    return {
        update(message: string) { text = message; },
        succeed(message: string) { clearInterval(timer); writeLine(styleText("green", `  ✔ ${message}`)); },
        fail(message: string) { clearInterval(timer); writeLine(styleText("red", `  ✖ ${message}`)); }
    };
}

// Make sure cursor is shown on exit
process.on("exit", showCursor);
process.on("SIGINT", () => { showCursor(); process.exit(130); });
process.on("uncaughtException", (e) => { showCursor(); throw e; })
