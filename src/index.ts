import { root, songAdd, songEdit, songRemove, songShow } from "./commands";
import { handle, registerCommand } from "./commands/handler"
import { validateSongId, validateSongSource, validateString } from "./commands/validate";

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
            description: "The album of the song to add",
            params: false,
            validate: validateString
        },
        {
            name: "artist",
            description: "The artist of the song to add",
            params: false,
            validate: validateString
        },
        {
            name: "source",
            description: "The source of the song (Local file | YouTube URL)",
            params: false,
            validate: validateSongSource
        }
    ],
    flags: [],
    run: songAdd
});

registerCommand({
    route: ["song", "show"],
    description: "Show the properties of a song",
    args: [
        {
            name: "id",
            description: "The ID of the song to show",
            params: false,
            validate: validateSongId
        }
    ],
    flags: [],
    run: songShow
});

registerCommand({
    route: ["song", "edit"],
    description: "Edit the properties of a song",
    args: [
        {
            name: "id",
            description: "The ID of the song to show",
            params: false,
            validate: validateSongId
        }
    ],
    flags: [
        {
            longName: "name",
            shortName: 'n',
            description: "Change the name of the song",
            switch: false,
            params: false,
            validate: validateString
        },
        {
            longName: "album",
            shortName: 'a',
            description: "Change the album of the song",
            switch: false,
            params: false,
            validate: validateString
        },
        {
            longName: "artist",
            shortName: 'x',
            description: "Change the artist of the song",
            switch: false,
            params: false,
            validate: validateString
        },
        {
            longName: "source",
            shortName: 's',
            description: "Change the song source (File path | YouTube URL)",
            switch: false,
            params: false,
            validate: validateSongSource
        }
    ],
    run: songEdit
});

registerCommand({
    route: ["song", "remove"],
    description: "Remove a song from the library",
    args: [
        {
            name: "id",
            description: "The ID of the song to remove",
            params: false,
            validate: validateSongId
        }
    ],
    flags: [],
    run: songRemove
});

process.exit(await handle(args));
