import { readFileSync } from "node:fs";
import { join } from "node:path";
import { serviceWorkerScript } from "@/lib/pwa/service-worker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function releaseVersion() {
  const fromEnv = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || "";
  const raw = fromEnv || readBuildId();
  const safe = raw.replace(/[^\w.-]/g, "").slice(0, 80);
  return safe || "development";
}

function readBuildId() {
  try {
    return readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
  } catch {
    return "";
  }
}

export function GET() {
  return new Response(serviceWorkerScript(releaseVersion()), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
