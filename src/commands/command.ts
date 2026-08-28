export interface ValidateResponse {
    success: boolean,
    value?: any,
    error?: string
}

export interface Argument {
    name: string,
    description: string,
    params: boolean,
    validate: (input: string) => Promise<ValidateResponse>
    value?: any,
}

export interface Flag {
    longName: string,
    shortName?: string,
    description: string,
    switch: boolean,
    params: boolean,
    validate: (input: string) => Promise<ValidateResponse>
}

export interface Command {
    route: string[],
    description: string,
    args: Argument[],
    flags: Flag[],
    run: (args: Argument[], flags: Flag[]) => Promise<number>
}
