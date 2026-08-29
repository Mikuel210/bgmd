import { library, play, root, songAdd, songEdit, songRemove, songShow, stop } from "./commands";
import { handle, registerCommand } from "./commands/handler"
import { validateLocalSource, validatePositiveInteger, validateSongId, validateString, validateYouTubeSource } from "./commands/validate";

let args = Bun.argv.slice(2);

registerCommand({
    route: [],
    description: "The background music daemon",
    args: [],
    flags: [],
    run: root
});

registerCommand({
    route: ["library"],
    description: "Show all songs in the library",
    args: [],
    flags: [],
    run: library
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
        }
    ],
    flags: [
        {
            longName: "disc-number",
            shortName: 'd',
            description: "Set the disc number for the song (default 1)",
            switch: false,
            params: false,
            validate: validatePositiveInteger
        },
        {
            longName: "track-number",
            shortName: 't',
            description: "Set the track number for the song (default next empty in disc)",
            switch: false,
            params: false,
            validate: validatePositiveInteger
        },
        {
            longName: "youtube-source",
            shortName: 'y',
            description: "Add a YouTube source for the song",
            switch: false,
            params: false,
            validate: validateYouTubeSource
        },
        {
            longName: "local-source",
            shortName: 'l',
            description: "Add a local source for the song",
            switch: false,
            params: false,
            validate: validateLocalSource
        }
    ],
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
            longName: "disc-number",
            shortName: 'd',
            description: "Change the disc number for the song",
            switch: false,
            params: false,
            validate: validatePositiveInteger
        },
        {
            longName: "track-number",
            shortName: 't',
            description: "Change the track number for the song",
            switch: false,
            params: false,
            validate: validatePositiveInteger
        },
        {
            longName: "youtube-source",
            shortName: 'y',
            description: "Change the YouTube source of the song",
            switch: false,
            params: false,
            validate: validateYouTubeSource
        },
        {
            longName: "local-source",
            shortName: 'l',
            description: "Change the local source of the song",
            switch: false,
            params: false,
            validate: validateLocalSource
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

registerCommand({
    route: ["play"],
    description: "Play a song",
    args: [
        {
            name: "id",
            description: "The ID of the song to play",
            params: false,
            validate: validateSongId
        }
    ],
    flags: [],
    run: play
});

registerCommand({
    route: ["stop"],
    description: "Stop playback",
    args: [],
    flags: [],
    run: stop
});

process.exit(await handle(args));
