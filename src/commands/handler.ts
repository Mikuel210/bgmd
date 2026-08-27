import type { ICommand } from "./command"

let commands: ICommand[] = [];

const isFlag = (arg: string) => arg.startsWith('-');
const isRoot = (command: ICommand) => command.route.length == 0;
const getRoot = () => commands.filter(e => isRoot(e))[0]!;

async function handle(args: string[]): Promise<number> {
    let command = resolveCommand(args);

    if (command == null) {
        console.log(`Command not found: bgmctl ${args.join(' ')}`);
        console.log("See: bgmctl --help");
        return 1;
    }

    return await command.run([], []);
}

function registerCommand(command: ICommand): void {
    commands.push(command);
}

function resolveCommand(args: string[]): ICommand | null {
    let matches: ICommand[] = [];

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
    let maxMatch: ICommand | null = null;

    for (const command of matches) {
        if (command.route.length <= max) continue;

        max = command.route.length;
        maxMatch = command;
    }

    return maxMatch;
}

function matchCommand(args: string[], command: ICommand): boolean {
    if (args.length < command.route.length) return false;
    if (isRoot(command) && args.length != 0) return false;

    for (let i = 0; i < command.route.length; i++) {
        if (command.route[i] != args[i])
            return false;
    }

    return true;
}

export { handle, registerCommand }
