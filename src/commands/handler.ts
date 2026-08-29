import type { Argument, Command, Flag } from "./command"
import { showHelp } from "./help";

export const isFlag = (arg: string) => arg.startsWith('-');
export const isRoot = (command: Command) => command.route.length == 0;
export const getRoot = () => commands.filter(e => isRoot(e))[0]!;

export let commands: Command[] = [];

async function handle(args: string[]): Promise<number> {
    // Resolve command
    let command = resolveCommand(args);

    if (command == null) {
        console.log(`Command not found: bgmctl ${args.join(' ')}`);
        console.log("See: bgmctl --help");
        return 1;
    }

    // Trigger help
    const positionalArgs = args.slice(command.route.length);

    if (positionalArgs.some(e => ["-h", "-?", "--help"].includes(e))) {
        showHelp(command);
        return 0;
    }

    // Validate arguments
    const validatedArgs: Argument[] = [];

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

        validatedArgs.push({ ...argument, value: result.value! });
    }

    // Validate flags
    let flagArgs = positionalArgs.slice(command.args.length);
    const firstFlagIndex = flagArgs.findIndex(e => isFlag(e));
    const validatedFlags: Flag[] = []

    if (firstFlagIndex == -1)
        return await command.run(validatedArgs, []);

    flagArgs = flagArgs.slice(firstFlagIndex);

    argLoop: for (let i = 0; i < flagArgs.length; i++) {
        const flagArg = flagArgs[i]!;

        for (const flag of command.flags) {
            if (flagArg != `--${flag.longName}` && flagArg != `-${flag.shortName}`)
                continue;

            if (flag.switch)
                validatedFlags.push(flag);

            i++;

            // Validate value
            const input = flagArgs[i];

            if (!input) {
                console.error(`[--${flag.longName}] can't be empty`);
                return 1;
            }

            const result = await flag.validate(input);

            if (!result.success) {
                console.error(`[--${flag.longName}]: ${result.error!}`);
                return 1;
            }

            validatedFlags.push({ ...flag, value: result.value });
            continue argLoop;
        }

        console.error(`Unknown option: ${flagArg}`);
        return 1;
    }

    // Run command
    return await command.run(validatedArgs, validatedFlags);
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
