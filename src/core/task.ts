export const CONCURRENT_TASKS = 10;

export type Result<T = void> =
    | { success: true, value: T }
    | { success: false, error: string }

export async function forEachConcurrent<T>(items: T[], task: (item: T, index: number) => Promise<void>, limit: number = CONCURRENT_TASKS): Promise<void> {
    let index = 0;

    async function worker() {
        while (index < items.length) {
            const current = items[index++]!;
            await task(current, index - 1);
        }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
    await Promise.all(workers);
}
