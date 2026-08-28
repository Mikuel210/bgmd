import type { Command, Flag } from "./command";
import { commands, isRoot } from "./handler";

const extraSpaces = 3;

export function showHelp(command: Command): void {
    console.log(`Usage: ${getUsage(command)}`);
    console.log(`Description: ${command.description}`);

    if (command.args.length > 0) {
        console.log("\nArguments:");
        const spaces = Math.max(...command.args.map(e => e.name.length)) + extraSpaces;

        for (const argument of command.args) {
            const spaceString = ' '.repeat(spaces - argument.name.length);
            console.log(`  ${argument.name}${spaceString}${argument.description}`);
        }
    }

    if (command.flags.length > 0) {
        console.log("\nFlags:");
        const names: Record<string, Flag> = {};

        for (const flag of command.flags) {
            let name = `--${flag.longName}`;

            if (flag.shortName)
                name = `-${flag.shortName}, ${name}`;

            names[name] = flag;
        }

        const spaces = Math.max(...Object.keys(names).map(e => e.length)) + extraSpaces;

        for (const flag of command.flags) {
            const name = Object.keys(names).find(e => names[e] == flag)!;
            const spaceString = ' '.repeat(spaces - name.length);

            console.log(`  ${name}${spaceString}${flag.description}`);
        }
    }
}

function getUsage(command: Command): string {
    if (isRoot(command))
        return "bgmctl <command> [<args>]";

    let args = command.args.map(e => `<${e.name}>`).join(' ');
    if (command.args.some(e => e.params)) args += "...";

    let flags = command.flags.map(flag => {
        let name = `--${flag.longName}`;

        if (flag.shortName)
            name = `-${flag.shortName} | ${name}`;

        if (flag.switch)
            return `[${name}]`;

        let value = `<${flag.longName}>`;

        if (flag.params)
            value += "...";

        return `[${name} ${value}]`;
    }).join(' ');

    return `bgmctl ${args} ${flags}`;
}
