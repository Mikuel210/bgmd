import { handle, registerCommand } from "./commands/handler"
import { handleRoot } from "./commands/general"

let args = Bun.argv.slice(2);

registerCommand({
    route: [],
    description: "The background music daemon",
    run: handleRoot
});

registerCommand({
    route: ["song", "add"],
    description: "Add a song to the library",
    run: () => {

        return 0;
    }
});

process.exit(handle(args));
