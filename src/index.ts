import { handle, registerCommand } from "./commands/handler"
import { handleRoot } from "./commands/general"
import { addSong } from "./commands/library"

let args = Bun.argv.slice(2);

registerCommand({
    route: [],
    description: "The background music daemon",
    run: handleRoot
});

registerCommand({
    route: ["song", "add"],
    description: "Add a song to the library",
    run: addSong
});

process.exit(await handle(args));
