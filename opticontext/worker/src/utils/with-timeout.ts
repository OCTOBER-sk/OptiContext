/**
 * Promise-timeout helper. Resolves/rejects with the underlying promise
 * unless it doesn't settle within `ms` milliseconds, in which case it
 * rejects with a timeout error.
 *
 * The underlying promise is NOT cancelled (no AbortController signal
 * is plumbed through). The caller is expected to use it for things
 * like "skip this adapter if it takes too long" rather than strict
 * cancellation. For network calls that *can* be cancelled, the
 * caller should pass a signal themselves.
 */
export async function withTimeout<T>(
  ms: number,
  promise: Promise<T>,
  label: string = "operation",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
