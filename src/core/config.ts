import path from "node:path";
import os from "node:os";

export const HOME_PATH = os.homedir();
export const CONCURRENT_DOWNLOADS = 5;
export const CONCURRENT_TASKS = 10;
export const MAX_QUEUE_ITEMS = 20;
export const MUSIC_PATH = path.join(HOME_PATH, "Music");
export const PORT = 8634;
