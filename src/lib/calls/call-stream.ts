export const replacedSocketCode = 4001;
export const sessionEndedSocketCode = 4002;

export type LiveCall = {
  reference: string;
  membershipId: string | null;
  csrId: string;
  csrName: string;
};

export type LiveCallSnapshot = {
  type: "snapshot";
  calls: LiveCall[];
};

export type PortalOpenCall = {
  reference: string;
  customer: { membershipId: string; firstName: string; lastName: string } | null;
};

export type CallSocket = {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: "message", listener: (data: unknown) => void): void;
  on(event: "close", listener: () => void): void;
};

type SocketEntry = {
  socket: CallSocket;
  timer: ReturnType<typeof setTimeout>;
};

type Hub = { sockets: Map<string, SocketEntry> };

const globalHub = globalThis as typeof globalThis & { __ampCallStream?: Hub };

function hub(): Hub {
  if (!globalHub.__ampCallStream) globalHub.__ampCallStream = { sockets: new Map() };
  return globalHub.__ampCallStream;
}

export function cookieValue(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  const prefix = `${name}=`;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return trimmed.slice(prefix.length);
  }
  return null;
}

function hostName(host: string): string {
  return host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "").toLowerCase();
}

function internalHost(host: string): boolean {
  const name = hostName(host);
  return name === "localhost" || name === "127.0.0.1" || name === "::1" || !name.includes(".");
}

export function requestOrigin(headers: { get(name: string): string | null }, url: string): string | null {
  let urlOrigin: URL | null = null;
  try {
    urlOrigin = new URL(url);
  } catch {
    urlOrigin = null;
  }
  // A public URL is the app. A caller-supplied forwarded host must not replace it.
  if (urlOrigin && !internalHost(urlOrigin.host)) return urlOrigin.origin;

  const host = firstHeader(headers.get("x-forwarded-host")) ?? headers.get("host");
  if (!host) return urlOrigin?.origin ?? null;
  const forwarded = firstHeader(headers.get("x-forwarded-proto"));
  const proto = forwarded || (url.startsWith("https:") ? "https" : "http");
  if (proto !== "http" && proto !== "https") return null;
  try {
    return new URL(`${proto}://${host}`).origin;
  } catch {
    return null;
  }
}

export function originAllowed(originHeader: string | null, expected: string | null): boolean {
  if (!originHeader || !expected) return false;
  try {
    return new URL(originHeader).origin === new URL(expected).origin;
  } catch {
    return false;
  }
}

function firstHeader(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim() ?? "";
  return first.length > 0 ? first : null;
}

export type ClientSocketAction = "ping" | "close" | "ignore";

export function clientSocketAction(data: unknown): ClientSocketAction {
  const text = readSocketText(data)?.trim() ?? "";
  if (text.length === 0 || text.length > 64) return "ignore";
  if (text === "ping") return "ping";
  if (text === "close") return "close";
  try {
    const parsed = JSON.parse(text) as { type?: unknown };
    if (!parsed || typeof parsed !== "object") return "ignore";
    if (parsed.type === "ping") return "ping";
    if (parsed.type === "close") return "close";
  } catch {
    return "ignore";
  }
  return "ignore";
}

function readSocketText(data: unknown): string | null {
  if (typeof data === "string") return data;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) return data.toString("utf8");
  if (data instanceof Uint8Array) return new TextDecoder().decode(data);
  return null;
}

export function toLiveCall(row: {
  reference: string;
  csrId: string;
  csr: { displayName: string };
  user: { membershipId: string } | null;
}): LiveCall {
  return {
    reference: row.reference,
    membershipId: row.user?.membershipId ?? null,
    csrId: row.csrId,
    csrName: row.csr.displayName,
  };
}

export function liveSnapshot(calls: LiveCall[]): LiveCallSnapshot {
  return {
    type: "snapshot",
    calls: calls.map((call) => ({
      reference: call.reference,
      membershipId: call.membershipId,
      csrId: call.csrId,
      csrName: call.csrName,
    })),
  };
}

export function onCallForMembership(calls: LiveCall[], membershipId: string): { reference: string; agent: string } | null {
  const match = calls.find((call) => call.membershipId !== null && call.membershipId.toLowerCase() === membershipId.toLowerCase());
  if (!match) return null;
  return { reference: match.reference, agent: match.csrName };
}

export function portalCall(serverCall: PortalOpenCall | null, ready: boolean, mine: LiveCall | null): PortalOpenCall | null {
  if (!ready) return serverCall;
  if (!mine) return null;
  const sameCustomer = serverCall?.reference === mine.reference && serverCall.customer?.membershipId === mine.membershipId;
  return {
    reference: mine.reference,
    customer: mine.membershipId
      ? {
          membershipId: mine.membershipId,
          firstName: sameCustomer ? serverCall.customer?.firstName ?? "" : "",
          lastName: sameCustomer ? serverCall.customer?.lastName ?? "" : "",
        }
      : null,
  };
}

export function attachCallSocket(csrId: string, sessionExp: number, socket: CallSocket, now = Date.now()) {
  const previous = hub().sockets.get(csrId);
  if (previous && previous.socket !== socket) {
    clearTimeout(previous.timer);
    hub().sockets.delete(csrId);
    try {
      previous.socket.close(replacedSocketCode, "replaced");
    } catch {
      // The previous socket is already gone. The new one still takes its place.
    }
  }
  const delay = Math.max(0, sessionExp * 1000 - now);
  const timer = setTimeout(() => {
    closeCallStream(csrId);
  }, delay);
  if (typeof timer === "object" && timer !== null && "unref" in timer) timer.unref();
  hub().sockets.set(csrId, { socket, timer });
  socket.on("close", () => {
    const current = hub().sockets.get(csrId);
    if (current?.socket !== socket) return;
    clearTimeout(current.timer);
    hub().sockets.delete(csrId);
  });
  socket.on("message", (data) => {
    const action = clientSocketAction(data);
    if (action === "ping") {
      try {
        socket.send('{"type":"pong"}');
      } catch {
        return;
      }
      return;
    }
    if (action === "close") {
      try {
        socket.close(1000);
      } catch {
        return;
      }
    }
  });
}

export function closeCallStream(csrId: string) {
  const current = hub().sockets.get(csrId);
  if (!current) return;
  clearTimeout(current.timer);
  hub().sockets.delete(csrId);
  try {
    current.socket.close(sessionEndedSocketCode, "session ended");
  } catch {
    return;
  }
}

export async function sendCallSnapshot(socket: CallSocket, load: () => Promise<LiveCallSnapshot>) {
  try {
    const snapshot = await load();
    socket.send(JSON.stringify(snapshot));
  } catch {
    try {
      socket.close(1011);
    } catch {
      return;
    }
  }
}

// A second Vercel instance does not share this map. A socket there misses
// the broadcast and catches up from Postgres when it connects or reconnects.
export async function publishOpenCalls(load: () => Promise<LiveCallSnapshot>) {
  let payload: string;
  try {
    payload = JSON.stringify(await load());
  } catch {
    return;
  }
  for (const [csrId, entry] of hub().sockets) {
    try {
      entry.socket.send(payload);
    } catch {
      clearTimeout(entry.timer);
      hub().sockets.delete(csrId);
    }
  }
}
