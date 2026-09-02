import type { Command, Flag } from "./command";
import { commands, isRoot } from "./handler";
import { logObject } from "../formatter";

export function showHelp(command: Command): void {
    console.log(`usage: ${getUsage(command)}`);
    console.log(`description: ${command.description}`);

    if (command.args.length > 0) {
        console.log("\nArguments:");
        logObject(Object.fromEntries(command.args.map(e => [e.name, e.description])), true);
    }

    if (command.flags.length > 0) {
        console.log("\nFlags:");

        const getName = (flag: Flag) => {
            let name = `--${flag.longName}`;

            if (flag.shortName)
                name = `-${flag.shortName}, ${name}`;

            return name
        };

        logObject(Object.fromEntries(command.flags.map(e => [getName(e), e.description])), true);
    }

    const subcommands = getSubcommands(command);

    if (subcommands.length > 0) {
        console.log(`\n${isRoot(command) ? "Available commands:" : "Subcommands:"}`);

        const getRoute = (command: Command) => `bgmctl ${command.route.join(' ')}`;
        logObject(Object.fromEntries(subcommands.map(e => [getRoute(e), e.description])), true);
    }
}

function getUsage(command: Command): string {
    if (isRoot(command))
        return "bgmctl <command> [<args>]";

    let args = command.args.map(e => `<${e.name}>`).join(' ');
    return `bgmctl ${args}`;
}

function getSubcommands(command: Command): Command[] {
    return commands.filter(e =>
        e.route.length > command.route.length &&
        JSON.stringify(e.route.slice(0, command.route.length)) == JSON.stringify(command.route)
    );
}
