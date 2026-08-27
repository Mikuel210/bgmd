import z from "zod"
import os from "node:os"
import path from "node:path"

const configPath = path.join(os.homedir(), ".config/bgmd")

async function load<T>(fileName: string, schema: z.ZodType): Promise<T> {
    const file = Bun.file(path.join(configPath, fileName));
    const object = await file.json();

    return schema.parse(object) as T;
}

async function save<T>(path: string, object: T): Promise<void> {
    await Bun.write(path, JSON.stringify(object, null, 4));
}

export { configPath, load, save }
