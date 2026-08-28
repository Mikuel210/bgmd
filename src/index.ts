import { handle, registerCommand } from "./commands/handler"
import { root, songAdd } from "./commands/command"
import { validateAddSong } from "./commands/argument";

let args = Bun.argv.slice(2);

registerCommand({
    route: [],
    description: "The background music daemon",
    args: [],
    flags: [],
    run: root
});

registerCommand({
    route: ["song", "add"],
    description: "Add a song to the library",
    args: [
        {
            name: "name",
            description: "The name of the song to add",
            params: false,
            validate: validateAddSong
        }
    ],
    flags: [],
    run: songAdd
});

process.exit(await handle(args));
