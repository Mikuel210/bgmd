import type { Argument } from "./argument";
import type { Command } from "./command"

let commands: Command[] = [];

const isFlag = (arg: string) => arg.startsWith('-');
const isRoot = (command: Command) => command.route.length == 0;
const getRoot = () => commands.filter(e => isRoot(e))[0]!;

async function handle(args: string[]): Promise<number> {
    // Resolve command
    let command = resolveCommand(args);

    if (command == null) {
        console.log(`Command not found: bgmctl ${args.join(' ')}`);
        console.log("See: bgmctl --help");
        return 1;
    }

    // Validate arguments
    const positionalArgs = args.slice(command.route.length);
    const validated: Argument[] = [];

    for (let i = 0; i < command.args.length; i++) {
        const argument = command.args[i]!;
        const input = positionalArgs[i];

        if (!input) {
            console.error(`<${argument.name}> is required`);
            return 1;
        }

        const result = await argument.validate(input);

        if (!result.success) {
            console.error(`<${argument.name}>: ${result.error!}`);
            return 1;
        }

        validated.push({ ...argument, value: result.value! });
    }

    // Run command
    return await command.run(validated, []);
}

function registerCommand(command: Command): void {
    commands.push(command);
}

function resolveCommand(args: string[]): Command | null {
    let matches: Command[] = [];

    if (args.length == 0)
        return getRoot();

    for (const command of commands) {
        if (matchCommand(args, command))
            matches.push(command)
    }

    if (matches.length == 0)
    {
        if (isFlag(args[0]!))
            return getRoot();

        return null;
    }

    // Return match with the longest route
    let max: number = 0;
    let maxMatch: Command | null = null;

    for (const command of matches) {
        if (command.route.length <= max) continue;

        max = command.route.length;
        maxMatch = command;
    }

    return maxMatch;
}

function matchCommand(args: string[], command: Command): boolean {
    if (args.length < command.route.length) return false;
    if (isRoot(command) && args.length != 0) return false;

    for (let i = 0; i < command.route.length; i++) {
        if (command.route[i] != args[i])
            return false;
    }

    return true;
}

export { handle, registerCommand }
