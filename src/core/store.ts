import type { Result } from "./task";
import { copyFileSync, renameSync } from "node:fs"
import path from "node:path"
import os from "node:os"
import z from "zod"

export const HOME_PATH = os.homedir();
export const CONFIG_PATH = path.join(HOME_PATH, ".config/bgmd");
const objectCache: Record<string, any> = {};

export async function load<T>(fileName: string, schema: z.ZodType): Promise<Result<T>> {
    let object;

    if (fileName in objectCache) {
        object = objectCache[fileName]
    } else {
        const file = Bun.file(path.join(CONFIG_PATH, fileName));
        object = await file.exists() ? await file.json() : {};
    }

    const result = schema.safeParse(object) as z.ZodSafeParseResult<T>;

    if (result.success) {
        objectCache[fileName] = structuredClone(result.data);

        return {
            success: true,
            value: result.data
        };
    }

    return {
        success: false,
        error: z.prettifyError(result.error)
    };
}

export async function save<T>(fileName: string, object: T): Promise<Result> {
    try {
        if (fileName in objectCache && objectCache[fileName] === object) {
            return {
                success: true,
                value: undefined
            }
        }

        const filePath = path.join(CONFIG_PATH, fileName);
        const tempPath = `${filePath}.tmp`;
        const backupPath = `${filePath}.bak`;

        // Create backup
        const file = Bun.file(filePath);

        if (await file.exists()) {
            copyFileSync(filePath, backupPath);
        }

        // Write file
        await Bun.write(tempPath, JSON.stringify(object, null, 4));
        renameSync(tempPath, filePath);

        objectCache[fileName] = structuredClone(object);

        return {
            success: true,
            value: undefined
        };
    } catch (e) {
        return {
            success: false,
            error: String(e)
        };
    }
}
