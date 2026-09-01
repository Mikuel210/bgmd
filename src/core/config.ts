import { HOME_PATH } from "./store";
import path from "node:path";

export const CONCURRENT_DOWNLOADS = 5;
export const CONCURRENT_TASKS = 10;
export const MUSIC_PATH = path.join(HOME_PATH, "Music");
export const PORT = 8686;
