"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { portalCall, sessionEndedSocketCode, type LiveCall, type PortalOpenCall } from "@/lib/calls/call-stream";

type CallStreamValue = {
  ready: boolean;
  calls: LiveCall[];
  myCall: PortalOpenCall | null;
};

const CallStreamContext = createContext<CallStreamValue | null>(null);

const fallbackMs = 30_000;

function sanitize(calls: unknown[]): LiveCall[] {
  return calls.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.reference !== "string" || typeof row.csrId !== "string" || typeof row.csrName !== "string") return [];
    return [{
      reference: row.reference,
      membershipId: typeof row.membershipId === "string" ? row.membershipId : null,
      csrId: row.csrId,
      csrName: row.csrName,
    }];
  });
}

export function CallStreamProvider({ csrId, serverCall, children }: { csrId: string; serverCall: PortalOpenCall | null; children: React.ReactNode }) {
  const [calls, setCalls] = useState<LiveCall[] | null>(null);

  useEffect(() => {
    let stopped = false;
    let socket: WebSocket | null = null;
    let socketOpen = false;
    let delay = 1000;
    let reconnectTimer = 0;
    let fallbackTimer = 0;
    let pingTimer = 0;

    function apply(next: LiveCall[]) {
      if (!stopped) setCalls(next);
    }

    async function refreshSnapshot() {
      if (stopped || socketOpen) return;
      try {
        const response = await fetch("/api/calls/live", { headers: { accept: "application/json" } });
        if (response.status === 401) {
          stopped = true;
          socket?.close(sessionEndedSocketCode);
          return;
        }
        if (!response.ok) return;
        const body = (await response.json()) as { type?: string; calls?: unknown };
        if (body.type === "snapshot" && Array.isArray(body.calls)) apply(sanitize(body.calls));
      } catch {
        return;
      }
    }

    function connect() {
      if (stopped) return;
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${proto}//${window.location.host}/api/calls/live`);
      socket = ws;
      ws.onopen = () => {
        socketOpen = true;
        delay = 1000;
      };
      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        try {
          const body = JSON.parse(event.data) as { type?: string; calls?: unknown };
          if (body.type !== "snapshot" || !Array.isArray(body.calls)) return;
          apply(sanitize(body.calls));
        } catch {
          return;
        }
      };
      ws.onclose = (event) => {
        socketOpen = false;
        if (stopped || event.code === sessionEndedSocketCode) return;
        const wait = event.code === 4001 ? Math.max(delay, 5000) : delay;
        delay = Math.min(delay * 2, 30_000);
        reconnectTimer = window.setTimeout(connect, wait);
      };
      ws.onerror = () => {
        if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) ws.close();
      };
    }

    connect();
    fallbackTimer = window.setInterval(() => {
      if (!socketOpen) void refreshSnapshot();
    }, fallbackMs);
    pingTimer = window.setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) socket.send('{"type":"ping"}');
    }, 25_000);

    return () => {
      stopped = true;
      window.clearTimeout(reconnectTimer);
      window.clearInterval(fallbackTimer);
      window.clearInterval(pingTimer);
      socket?.close(1000);
    };
  }, [csrId]);

  const value = useMemo<CallStreamValue>(() => {
    const mine = calls?.find((call) => call.csrId === csrId) ?? null;
    return {
      ready: calls !== null,
      calls: calls ?? [],
      myCall: portalCall(serverCall, calls !== null, mine),
    };
  }, [calls, csrId, serverCall]);

  return <CallStreamContext.Provider value={value}>{children}</CallStreamContext.Provider>;
}

export function useCallStream() {
  return useContext(CallStreamContext);
}

export function usePortalCall(serverCall: PortalOpenCall | null) {
  const stream = useCallStream();
  if (!stream) return serverCall;
  return stream.myCall;
}
