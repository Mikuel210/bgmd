import type z from "zod";
import { LibrarySchema, type Library } from "../core/library";
import { load, save } from "../core/store"

const LIBRARY_FILENAME = "library.json"

export function loadLibrary(): Promise<z.ZodSafeParseResult<Library>> {
    return load<Library>(LIBRARY_FILENAME, LibrarySchema);
}

export function saveLibrary(library: Library): Promise<void> {
    return save<Library>(LIBRARY_FILENAME, library);
}
