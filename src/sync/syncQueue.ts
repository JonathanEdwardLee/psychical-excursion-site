let chain: Promise<unknown> = Promise.resolve();

export function enqueueSyncMutation<T>(job: () => Promise<T>): Promise<T> {
  const next = chain.then(job, job) as Promise<T>;
  chain = next.catch(() => {});
  return next;
}

export function resetSyncQueueForTests(): void {
  chain = Promise.resolve();
}
