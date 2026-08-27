import z from "zod"
import os from "node:os"
import path from "node:path"

const configPath = path.join(os.homedir(), ".config/bgmd")

async function load<T>(fileName: string, schema: z.ZodType): Promise<z.ZodSafeParseResult<T>> {
    const file = Bun.file(path.join(configPath, fileName));
    const object = await file.exists() ? await file.json() : {};

    return schema.safeParse(object) as z.ZodSafeParseResult<T>;
}

async function save<T>(fileName: string, object: T): Promise<void> {
    await Bun.write(path.join(configPath, fileName), JSON.stringify(object, null, 4));
}

export { configPath, load, save }
