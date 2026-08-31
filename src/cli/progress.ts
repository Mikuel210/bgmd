import spinners from "unicode-animations";
import { styleText } from "node:util";

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
