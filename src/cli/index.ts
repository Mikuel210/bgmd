import { validateAlbum, validateArtist, validateLocalSource, validatePositiveInteger, validateSong, validateString, validateYouTubeSource } from "./framework/validate";
import { songAdd, songEdit, songList, songRemove, songShow } from "./commands/song";
import { albumEdit, albumList, albumRemove, albumShow } from "./commands/album";
import { captureAlbum, captureArtist, captureSong } from "./commands/capture";
import { play, root, status, stop } from "./commands/general";
import { handle, registerCommand } from "./framework/handler"
import { pull } from "./commands/pull";
import { artistList, artistShow } from "./commands/artist";

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
    route: ["song", "list"],
    description: "List all songs in the library",
    args: [],
    flags: [],
    run: songList
});

registerCommand({
    route: ["song", "add"],
    description: "Add a song to the library",
    args: [
        {
            name: "name",
            description: "The name of the song to add",
            validate: validateString
        },
        {
            name: "album",
            description: "The album of the song to add",
            validate: validateString
        },
        {
            name: "artist",
            description: "The artist of the song to add",
            validate: validateString
        }
    ],
    flags: [
        {
            longName: "disc-number",
            shortName: 'd',
            description: "Set the disc number for the song (default 1)",
            validate: validatePositiveInteger
        },
        {
            longName: "track-number",
            shortName: 't',
            description: "Set the track number for the song (default next empty in disc)",
            validate: validatePositiveInteger
        },
        {
            longName: "youtube-source",
            shortName: 'y',
            description: "Add a YouTube source for the song",
            validate: validateYouTubeSource
        },
        {
            longName: "local-source",
            shortName: 'l',
            description: "Add a local source for the song",
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
            validate: validateSong
        }
    ],
    flags: [
        {
            longName: "name",
            shortName: 'n',
            description: "Change the name of the song",
            validate: validateString
        },
        {
            longName: "album",
            shortName: 'a',
            description: "Change the album of the song",
            validate: validateString
        },
        {
            longName: "artist",
            shortName: 'x',
            description: "Change the artist of the song",
            validate: validateString
        },
        {
            longName: "disc-number",
            shortName: 'd',
            description: "Change the disc number for the song",
            validate: validatePositiveInteger
        },
        {
            longName: "track-number",
            shortName: 't',
            description: "Change the track number for the song",
            validate: validatePositiveInteger
        },
        {
            longName: "youtube-source",
            shortName: 'y',
            description: "Change the YouTube source of the song",
            validate: validateYouTubeSource
        },
        {
            longName: "local-source",
            shortName: 'l',
            description: "Change the local source of the song",
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
    route: ["album", "show"],
    description: "Show the properties of an album",
    args: [
        {
            name: "album",
            description: "The name of the album to show",
            validate: validateAlbum
        }
    ],
    flags: [],
    run: albumShow
});

registerCommand({
    route: ["album", "edit"],
    description: "Edit the properties of an album",
    args: [
        {
            name: "album",
            description: "The name of the album to edit",
            validate: validateAlbum
        }
    ],
    flags: [
        {
            longName: "name",
            shortName: 'n',
            description: "Change the name of the album",
            validate: validateString
        },
        {
            longName: "artist",
            shortName: 'a',
            description: "Change the artist of the album",
            validate: validateString
        }
    ],
    run: albumEdit
});

registerCommand({
    route: ["album", "remove"],
    description: "Remove an album from the library",
    args: [
        {
            name: "album",
            description: "The name of the album to remove",
            validate: validateAlbum
        }
    ],
    flags: [],
    run: albumRemove
});

registerCommand({
    route: ["artist", "list"],
    description: "List all artists in the library",
    args: [],
    flags: [],
    run: artistList
});

registerCommand({
    route: ["artist", "show"],
    description: "Show the properties of an artist",
    args: [
        {
            name: "artist",
            description: "The name of the artist to show",
            validate: validateArtist
        }
    ],
    flags: [],
    run: artistShow
});

registerCommand({
    route: ["capture", "song"],
    description: "Search and add a song to the library",
    args: [
        {
            name: "name",
            description: "The name of the song to capture",
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
