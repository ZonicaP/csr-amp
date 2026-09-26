export const authLimit = { max: 10, windowMs: 10 * 60 * 1000 };
export const standardLimit = { max: 240, windowMs: 60 * 1000 };

const staleAfterMs = authLimit.windowMs;

export function decideRateLimit(existing: number[], max: number, windowMs: number, now = Date.now()) {
  const hits = existing.filter((at) => now - at < windowMs).sort((left, right) => left - right);
  if (hits.length >= max) {
    const retryAfter = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    return { ok: false as const, retryAfter, hits };
  }
  hits.push(now);
  return { ok: true as const, hits };
}

export async function updateRateHits(key: string, now: number, update: (hits: number[]) => number[]) {
  const { prisma } = await import("../prisma.ts");
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0::bigint))`;
    const row = await tx.rateLimitBucket.findUnique({ where: { key } });
    const next = update(parseHits(row?.hits));
    if (next.length === 0) {
      if (row) await tx.rateLimitBucket.delete({ where: { key } });
    } else {
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, hits: next },
        update: { hits: next },
      });
    }
    await tx.rateLimitBucket.deleteMany({
      where: { updatedAt: { lt: new Date(now - staleAfterMs) }, key: { not: key } },
    });
    return next;
  });
}

export async function consumeRateLimit(key: string, max: number, windowMs: number, now = Date.now()) {
  const outcome = { ok: true, retryAfter: 0 };
  await updateRateHits(key, now, (existing) => {
    const decision = decideRateLimit(existing, max, windowMs, now);
    outcome.ok = decision.ok;
    outcome.retryAfter = decision.ok ? 0 : decision.retryAfter;
    return decision.hits;
  });
  return outcome.ok ? { ok: true as const } : { ok: false as const, retryAfter: outcome.retryAfter };
}

export function clientRateKey(request: Request, actorId?: string) {
  const url = new URL(request.url);
  const actor = actorId && actorId.length > 0 ? actorId : "anon";
  return `${clientIp(request)}:${request.method}:${url.pathname}:${actor}`;
}

function parseHits(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => typeof item === "number" && Number.isFinite(item));
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
