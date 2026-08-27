interface Command {
    route: string[],
    description: string,
    run: (args: Argument[], flags: Flag[]) => Promise<number>
}

interface Argument {
    value: any,
    description: string,
    params: boolean,
    validate: (input: string) => boolean
}

interface Flag { }

export type { Command as ICommand, Argument as IArgument, Flag as IFlag }
