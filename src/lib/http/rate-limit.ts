// Counts live in this process only. On serverless, each instance has its own window.

const buckets = new Map<string, number[]>();
const maxBuckets = 5000;

export const authLimit = { max: 10, windowMs: 10 * 60 * 1000 };
export const standardLimit = { max: 240, windowMs: 60 * 1000 };

export function resetRateLimits() {
  buckets.clear();
}

export function consumeRateLimit(key: string, max: number, windowMs: number, now = Date.now()) {
  const hits = (buckets.get(key) ?? []).filter((at) => now - at < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    const retryAfter = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    return { ok: false as const, retryAfter };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > maxBuckets) {
    const oldest = buckets.keys().next().value;
    if (oldest !== undefined) buckets.delete(oldest);
  }
  return { ok: true as const };
}

export function clientRateKey(request: Request, actorId?: string) {
  const url = new URL(request.url);
  const actor = actorId && actorId.length > 0 ? actorId : "anon";
  return `${clientIp(request)}:${request.method}:${url.pathname}:${actor}`;
}

function clientIp(request: Request) {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return clip(real);
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    const last = hops[hops.length - 1];
    if (last) return clip(last);
  }
  return "unknown";
}

function clip(value: string) {
  return value.slice(0, 64);
}
