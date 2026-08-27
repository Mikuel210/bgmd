import type { IArgument, IFlag } from "./command"

async function handleRoot(args: IArgument[], flags: IFlag[]): Promise<number> {
    console.log("Usage: bgmctl <command> [<args>]");
    console.log("See: bgmctl --help");
    return 0;
}

export { handleRoot }
