import type { TaskResult } from "../task"

export interface Argument {
    name: string,
    description: string,
    params: boolean,
    validate: (input: string) => Promise<TaskResult>
    value?: any,
}

export interface Flag {
    longName: string,
    shortName?: string,
    description: string,
    switch: boolean,
    params: boolean,
    validate: (input: string) => Promise<TaskResult>,
    value?: any
}

export interface Command {
    route: string[],
    description: string,
    args: Argument[],
    flags: Flag[],
    run: (args: Argument[], flags: Flag[]) => Promise<number>
}
