import assert from "node:assert/strict";
import test from "node:test";
import { serviceWorkerScript } from "./service-worker.ts";

test("each release gets its own service worker script", () => {
  const first = serviceWorkerScript("dpl_one");
  const second = serviceWorkerScript("dpl_two");
  assert.notEqual(first, second);
  assert.match(first, /amp-csr dpl_one/);
  assert.match(first, /SKIP_WAITING/);
  assert.doesNotMatch(first, /caches\.open/);
});
