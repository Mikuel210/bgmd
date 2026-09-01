import { validateLocalSource, validatePositiveInteger, validateSong, validateString, validateYouTubeSource } from "./framework/validate";
import { songAdd, songEdit, songRemove, songShow } from "./commands/song";
import { captureAlbum, captureArtist, captureSong } from "./commands/capture";
import { play, root, status, stop } from "./commands/general";
import { handle, registerCommand } from "./framework/handler"
import { library } from "./commands/library";
import { pull } from "./commands/pull";
import { albumList } from "./commands/album";

let args = Bun.argv.slice(2);

registerCommand({
    route: [],
    description: "The background music daemon",
    args: [],
    flags: [],
    run: root
});

registerCommand({
    route: ["status"],
    description: "See the current status of playback",
    args: [],
    flags: [],
    run: status
});

registerCommand({
    route: ["play"],
    description: "Play a song",
    args: [
        {
            name: "song",
            description: "The name or ID of the song to play",
            params: false,
            validate: validateSong
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
            name: "song",
            description: "The name or ID of the song to show",
            params: false,
            validate: validateSong
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
            name: "song",
            description: "The name or ID of the song to show",
            params: false,
            validate: validateSong
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
            name: "song",
            description: "The name or ID of the song to remove",
            params: false,
            validate: validateSong
        }
    ],
    flags: [],
    run: songRemove
});

registerCommand({
    route: ["album", "list"],
    description: "List all albums in the library",
    args: [],
    flags: [],
    run: albumList
});

registerCommand({
    route: ["capture", "song"],
    description: "Search and add a song to the library",
    args: [
        {
            name: "name",
            description: "The name of the song to capture",
            params: false,
            validate: validateString
        }
    ],
    flags: [],
    run: captureSong
});

registerCommand({
    route: ["capture", "album"],
    description: "Search and add an album to the library",
    args: [
        {
            name: "name",
            description: "The name of the album to capture",
            params: false,
            validate: validateString
        }
    ],
    flags: [],
    run: captureAlbum
});

registerCommand({
    route: ["capture", "artist"],
    description: "Search and add an artist to the library",
    args: [
        {
            name: "name",
            description: "The name of the artist to capture",
            params: false,
            validate: validateString
        }
    ],
    flags: [],
    run: captureArtist
});

registerCommand({
    route: ["pull"],
    description: "Download all missing songs in the library",
    args: [],
    flags: [],
    run: pull
});

process.exit(await handle(args));
