const CONCURRENT_TASKS = 10;

export interface TaskResult {
    success: boolean,
    value?: any,
    error?: string
}

export async function forEachConcurrent<T>(items: T[], task: (item: T) => Promise<void>): Promise<void> {
    let index = 0;

    async function worker() {
        while (index < items.length) {
            const current = items[index++]!;
            await task(current);
        }
    }

    const workers = Array.from({ length: Math.min(CONCURRENT_TASKS, items.length) }, () => worker());
    await Promise.all(workers);
}
