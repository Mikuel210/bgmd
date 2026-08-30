export interface TaskResult {
    success: boolean,
    value?: any,
    error?: string
}

export async function runWithConcurrency<T>(items: T[], limit: number, task: (item: T) => Promise<void>): Promise<void> {
    let index = 0;

    async function worker() {
        while (index < items.length) {
            const current = items[index++]!;
            await task(current);
        }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
    await Promise.all(workers);
}
