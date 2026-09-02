import type { Command, Flag } from "./command";
import { commands, isRoot } from "./handler";
import { styleText } from "node:util";
import { logObject, logTitle } from "../formatter";

export function showHelp(command: Command): void {
    logTitle("usage", getUsage(command));
    logTitle("description", command.description);

    if (command.args.length > 0) {
        console.log("\nArguments:");
        logObject(Object.fromEntries(command.args.map(e => [e.name, e.description])));
    }

    if (command.flags.length > 0) {
        console.log("\nFlags:");

        const getName = (flag: Flag) => {
            let name = `--${flag.longName}`;

            if (flag.shortName)
                name = `-${flag.shortName}, ${name}`;

            return name
        };

        logObject(Object.fromEntries(command.flags.map(e => [getName(e), e.description])));
    }

    const subcommands = getSubcommands(command);

    if (subcommands.length > 0) {
        console.log(`\n${isRoot(command) ? "Available commands:" : "Subcommands:"}`);

        const getRoute = (command: Command) => `bgmctl ${command.route.join(' ')}`;
        logObject(Object.fromEntries(subcommands.map(e => [getRoute(e), e.description])));
    }
}

function getUsage(command: Command): string {
    if (isRoot(command))
        return "bgmctl <command> [<args>]";

    let args = command.args.map(e => `<${e.name}>`).join(' ');

    let flags = command.flags.map(flag => {
        let name = `--${flag.longName}`;

        if (flag.shortName)
            name = `-${flag.shortName} | ${name}`;

        let value = `<${flag.longName}>`;
        return `[${name} ${value}]`;
    }).join(' ');

    return `bgmctl ${args} ${flags}`;
}

function getSubcommands(command: Command): Command[] {
    return commands.filter(e =>
        e.route.length > command.route.length &&
        JSON.stringify(e.route.slice(0, command.route.length)) == JSON.stringify(command.route)
    );
}
