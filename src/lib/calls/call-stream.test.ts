import assert from "node:assert/strict";
import test from "node:test";
import { standardLimit } from "../http/rate-limit.ts";
import {
  attachCallSocket,
  clientSocketAction,
  closeCallStream,
  cookieValue,
  liveSnapshot,
  onCallForMembership,
  originAllowed,
  portalCall,
  requestOrigin,
  sessionEndedSocketCode,
  toLiveCall,
  type CallSocket,
} from "./call-stream.ts";

function headers(values: Record<string, string>) {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

function fakeSocket() {
  const sent: string[] = [];
  const closed: Array<{ code?: number; reason?: string }> = [];
  const listeners = new Map<string, Array<(data?: unknown) => void>>();
  const socket: CallSocket = {
    send(data) {
      sent.push(data);
    },
    close(code, reason) {
      closed.push({ code, reason });
      for (const listener of listeners.get("close") ?? []) listener();
    },
    on(event, listener) {
      const list = listeners.get(event) ?? [];
      list.push(listener as (data?: unknown) => void);
      listeners.set(event, list);
    },
  };
  return {
    socket,
    sent,
    closed,
    message(data: unknown) {
      for (const listener of listeners.get("message") ?? []) listener(data);
    },
  };
}

test("origin must match this app and a missing origin is rejected", () => {
  const expected = requestOrigin(headers({ host: "localhost:3000" }), "http://localhost:3000/api/calls/live");
  assert.equal(expected, "http://localhost:3000");
  assert.equal(originAllowed("http://localhost:3000", expected), true);
  assert.equal(originAllowed("https://evil.example", expected), false);
  assert.equal(originAllowed(null, expected), false);
  assert.equal(originAllowed("http://localhost:3000", null), false);
});

test("forwarded host is the app origin, not the caller origin", () => {
  const expected = requestOrigin(
    headers({ "x-forwarded-host": "portal.example", "x-forwarded-proto": "https", host: "internal" }),
    "http://internal/api/calls/live",
  );
  assert.equal(expected, "https://portal.example");
  assert.equal(originAllowed("https://portal.example", expected), true);
  assert.equal(originAllowed("https://evil.example", expected), false);
});

test("a public request url is not replaced by a forwarded host", () => {
  const expected = requestOrigin(
    headers({ "x-forwarded-host": "evil.example", "x-forwarded-proto": "https", host: "csr-amp-ten.vercel.app" }),
    "https://csr-amp-ten.vercel.app/api/calls/live",
  );
  assert.equal(expected, "https://csr-amp-ten.vercel.app");
  assert.equal(originAllowed("https://evil.example", expected), false);
  assert.equal(originAllowed("https://csr-amp-ten.vercel.app", expected), true);
});

test("client messages cannot change a call", () => {
  assert.equal(clientSocketAction("ping"), "ping");
  assert.equal(clientSocketAction('{"type":"ping"}'), "ping");
  assert.equal(clientSocketAction("close"), "close");
  assert.equal(clientSocketAction('{"type":"close"}'), "close");
  for (const body of ['{"type":"start"}', '{"type":"end"}', '{"type":"link"}', '{"type":"unlink"}', '{"action":"handoff"}', '{"type":"transfer"}']) {
    assert.equal(clientSocketAction(body), "ignore");
  }
  assert.equal(clientSocketAction("ping-and-then-end-the-call-with-extra-text-past-the-cap"), "ignore");
});

test("a snapshot only keeps open-call fields", () => {
  const snapshot = liveSnapshot([
    toLiveCall({
      reference: "C-10001",
      csrId: "csr-1",
      csr: { displayName: "Alex Morgan" },
      user: { membershipId: "AMP-10001" },
    }),
    toLiveCall({
      reference: "C-10002",
      csrId: "csr-2",
      csr: { displayName: "Sam Lee" },
      user: null,
    }),
  ]);
  assert.deepEqual(snapshot, {
    type: "snapshot",
    calls: [
      { reference: "C-10001", membershipId: "AMP-10001", csrId: "csr-1", csrName: "Alex Morgan" },
      { reference: "C-10002", membershipId: null, csrId: "csr-2", csrName: "Sam Lee" },
    ],
  });
  assert.deepEqual(Object.keys(snapshot.calls[0]).sort(), ["csrId", "csrName", "membershipId", "reference"]);
});

test("the customers list names the CSR on the linked membership", () => {
  const calls = liveSnapshot([
    toLiveCall({ reference: "C-10001", csrId: "csr-1", csr: { displayName: "Alex Morgan" }, user: { membershipId: "AMP-10001" } }),
  ]).calls;
  assert.deepEqual(onCallForMembership(calls, "amp-10001"), { reference: "C-10001", agent: "Alex Morgan" });
  assert.equal(onCallForMembership(calls, "AMP-99999"), null);
});

test("a new socket closes the previous one for that CSR", () => {
  const first = fakeSocket();
  const second = fakeSocket();
  const exp = Math.floor(Date.now() / 1000) + 3600;
  attachCallSocket("csr-replace", exp, first.socket);
  attachCallSocket("csr-replace", exp, second.socket);
  assert.deepEqual(first.closed, [{ code: 4001, reason: "replaced" }]);
  second.message('{"type":"end","csrId":"csr-2"}');
  second.message('{"type":"ping"}');
  assert.deepEqual(second.sent, ['{"type":"pong"}']);
  assert.equal(second.closed.length, 0);
});

test("ending the session closes the socket", () => {
  const open = fakeSocket();
  const exp = Math.floor(Date.now() / 1000) + 3600;
  attachCallSocket("csr-signout", exp, open.socket);
  closeCallStream("csr-signout");
  assert.equal(open.closed[0]?.code, sessionEndedSocketCode);
  closeCallStream("csr-signout");
  assert.equal(open.closed.length, 1);
});

test("the portal call follows the snapshot and hides a call this CSR no longer has", () => {
  const serverCall = { reference: "C-10001", customer: { membershipId: "AMP-10001", firstName: "Ava", lastName: "Patel" } };
  assert.equal(portalCall(serverCall, false, null), serverCall);
  assert.equal(portalCall(serverCall, true, null), null);
  assert.equal(portalCall(serverCall, true, { reference: "C-20002", membershipId: null, csrId: "csr-1", csrName: "Alex" })?.customer, null);
});

test("the session cookie is read without keeping the rest of the header", () => {
  assert.equal(cookieValue("theme=light; csr_session=abc.def; other=1", "csr_session"), "abc.def");
  assert.equal(cookieValue(null, "csr_session"), null);
});

test("normal reconnects stay under the standard rate limit", () => {
  const reconnectsInOneMinute = 6;
  assert.equal(standardLimit.windowMs, 60_000);
  assert.ok(standardLimit.max >= 60);
  assert.ok(reconnectsInOneMinute < standardLimit.max);
});
