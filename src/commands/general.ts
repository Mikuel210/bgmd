import type { IArgument, IFlag } from "./command"

function handleRoot(args: IArgument[], flags: IFlag[]): number {
    console.log("Usage: bgmctl <command> [<args>]");
    console.log("See: bgmctl --help");
    return 0;
}

export { handleRoot }
