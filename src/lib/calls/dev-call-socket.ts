import http from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer } from "ws";
import { attachCallSocket, originAllowed, requestOrigin, sendCallSnapshot, type CallSocket } from "@/lib/calls/call-stream";
import { loadOpenCallSnapshot } from "@/lib/calls/call-stream-server";
import { currentCsr } from "@/lib/csr/csr-service";
import { sessionFromCookieHeader } from "@/lib/csr/session";
import { clientRateKey, consumeRateLimit, standardLimit } from "@/lib/http/rate-limit";

const socketPath = "/api/calls/live";

// next dev ends an upgrade that matches a route, and experimental_upgradeWebSocket
// runs on the Vercel runtime. This listener accepts the same path in the one
// local Node process. Vercel uses the route handler instead.
export function listenForDevCallSocket() {
  if (process.env.VERCEL) return;
  const marker = globalThis as typeof globalThis & { __ampDevCallSocket?: boolean };
  if (marker.__ampDevCallSocket) return;
  marker.__ampDevCallSocket = true;
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  const server = http.Server.prototype;
  const emit = server.emit;
  server.emit = function (this: http.Server, event: string | symbol, ...args: unknown[]) {
    if (event !== "upgrade") return emit.call(this, event, ...args);
    const req = args[0] as http.IncomingMessage;
    const pathname = (req.url ?? "").split("?")[0];
    if (pathname !== socketPath) return emit.call(this, event, ...args);
    void acceptDevUpgrade(req, args[1] as Duplex, args[2] as Buffer, wss);
    return true;
  } as typeof server.emit;
}

async function acceptDevUpgrade(req: http.IncomingMessage, socket: Duplex, head: Buffer, wss: WebSocketServer) {
  const headers = nodeHeaders(req);
  const host = headers.get("host") ?? "localhost";
  const requestUrl = `http://${host}${req.url ?? socketPath}`;
  const request = new Request(requestUrl, { headers });
  const limited = await consumeRateLimit(clientRateKey(request), standardLimit.max, standardLimit.windowMs);
  if (!limited.ok) {
    rejectUpgrade(socket, 429, "Too many requests. Try again later.");
    return;
  }
  const session = sessionFromCookieHeader(headers.get("cookie"));
  if (!session) {
    rejectUpgrade(socket, 401, "Sign in as an active CSR");
    return;
  }
  try {
    await currentCsr(session.csrId);
  } catch {
    rejectUpgrade(socket, 401, "Sign in as an active CSR");
    return;
  }
  if (!originAllowed(headers.get("origin"), requestOrigin(headers, requestUrl))) {
    rejectUpgrade(socket, 403, "This call stream is only available from the portal");
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    const callSocket = ws as unknown as CallSocket;
    attachCallSocket(session.csrId, session.exp, callSocket);
    void sendCallSnapshot(callSocket, loadOpenCallSnapshot);
  });
}

function nodeHeaders(req: http.IncomingMessage) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(", "));
  }
  return headers;
}

function rejectUpgrade(socket: Duplex, status: number, message: string) {
  const reason = status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : status === 429 ? "Too Many Requests" : "Bad Request";
  const body = JSON.stringify({ error: message });
  socket.write(
    `HTTP/1.1 ${status} ${reason}\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`,
  );
  socket.destroy();
}
