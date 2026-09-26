import { updateRateHits } from "@/lib/http/rate-limit";

const windowMs = 10 * 60 * 1000;

function openHits(existing: number[], now: number) {
  return existing.filter((at) => now - at < windowMs).sort((left, right) => left - right);
}

export async function authBlocked(key: string, max: number, now = Date.now()) {
  const hits = await updateRateHits(key, now, (existing) => openHits(existing, now));
  if (hits.length < max) return { ok: true as const };
  const retryAfter = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
  return { ok: false as const, retryAfter };
}

export async function recordAuthFailure(key: string, now = Date.now()) {
  await updateRateHits(key, now, (existing) => {
    const hits = openHits(existing, now);
    hits.push(now);
    return hits;
  });
}

export async function clearAuthAttempts(key: string, now = Date.now()) {
  await updateRateHits(key, now, () => []);
}
