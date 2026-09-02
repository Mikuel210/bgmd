import type { Result } from "../../core/task"

export interface Argument {
    name: string,
    description: string,
    validate: (input: string) => Promise<Result<any>>,
    value?: any,
}

export interface Flag {
    longName: string,
    shortName?: string,
    description: string,
    validate: (input: string) => Promise<Result<any>>,
    value?: any
}

export interface Command {
    route: string[],
    description: string,
    args: Argument[],
    flags: Flag[],
    run: (args: Argument[], flags: Flag[]) => Promise<number>
}
