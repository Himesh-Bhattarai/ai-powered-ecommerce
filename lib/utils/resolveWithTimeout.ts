export async function resolveWithTimeout<T>(
  task: Promise<T>,
  timeoutMs = 1200
): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), timeoutMs);
  });

  try {
    return await Promise.race([task, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
