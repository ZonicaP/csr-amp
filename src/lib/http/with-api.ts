import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/csr/http";
import { readSession } from "@/lib/csr/session";
import { authLimit, clientRateKey, consumeRateLimit, standardLimit } from "@/lib/http/rate-limit";

export type ApiRouteOptions = {
  auth: "public" | "required";
  limit: "none" | "auth" | "standard";
};

export function withApi<C>(
  handler: (request: Request, context: C) => Promise<Response> | Response,
  options: ApiRouteOptions,
) {
  return async function apiRoute(request: Request, context: C): Promise<Response> {
    try {
      const session = options.auth === "required" ? await readSession() : null;
      if (options.limit !== "none") {
        const rule = options.limit === "auth" ? authLimit : standardLimit;
        const key = clientRateKey(request, session?.csrId);
        const limited = await consumeRateLimit(key, rule.max, rule.windowMs);
        if (!limited.ok) {
          return NextResponse.json(
            { error: "Too many requests. Try again later." },
            { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
          );
        }
      }
      if (options.auth === "required" && !session) {
        return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
      }
      return await handler(request, context);
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
}
