import { handle, registerCommand } from "./commands/handler"
import { root, songAdd } from "./commands/command"
import { validateAddSong, validateString } from "./commands/argument";

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
            validate: validateString
        },
        {
            name: "album",
            description: "The album on which the song appears",
            params: false,
            validate: validateString
        },
        {
            name: "artist",
            description: "The artist of the song",
            params: false,
            validate: validateString
        }
    ],
    flags: [],
    run: songAdd
});

process.exit(await handle(args));
