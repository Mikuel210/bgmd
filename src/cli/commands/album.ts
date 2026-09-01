import type { Argument, Flag } from "../framework/command";

export async function showAlbum(args: Argument[], flags: Flag[]) {
    const query = args[0]!.value as string;
}
