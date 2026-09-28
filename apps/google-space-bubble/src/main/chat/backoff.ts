const BASE_MS = 1_000;
const MAX_MS = 60_000;

/**
 * Truncated exponential backoff: min(2^attempt × 1s + jitter(0~1s), 60s)
 * attempt는 0부터 시작한다.
 */
export function backoffMs(attempt: number, random: () => number = Math.random): number {
  const exp = BASE_MS * 2 ** Math.min(attempt, 10);
  return Math.min(exp + Math.floor(random() * 1_000), MAX_MS);
}
