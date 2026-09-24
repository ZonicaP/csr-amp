const windowMs = 10 * 60 * 1000;
const attempts = new Map<string, number[]>();

function recent(key: string, now: number) {
  return (attempts.get(key) ?? []).filter((at) => now - at < windowMs);
}

export function authBlocked(key: string, max: number, now = Date.now()) {
  const hits = recent(key, now);
  attempts.set(key, hits);
  if (hits.length < max) return { ok: true as const };
  const retryAfter = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
  return { ok: false as const, retryAfter };
}

export function recordAuthFailure(key: string, now = Date.now()) {
  const hits = recent(key, now);
  hits.push(now);
  attempts.set(key, hits);
}

export function clearAuthAttempts(key: string) {
  attempts.delete(key);
}
