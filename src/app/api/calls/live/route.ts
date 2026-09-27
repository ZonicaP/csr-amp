import { experimental_upgradeWebSocket } from "@vercel/functions";
import { NextResponse } from "next/server";
import { attachCallSocket, originAllowed, requestOrigin, sendCallSnapshot, type CallSocket } from "@/lib/calls/call-stream";
import { loadOpenCallSnapshot } from "@/lib/calls/call-stream-server";
import { currentCsr } from "@/lib/csr/csr-service";
import { readSession } from "@/lib/csr/session";
import { withApi } from "@/lib/http/with-api";

export const GET = withApi(async function GET(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
  try {
    await currentCsr(session.csrId);
  } catch {
    return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
  }
  const upgrade = request.headers.get("upgrade");
  if (upgrade?.toLowerCase() !== "websocket") {
    const snapshot = await loadOpenCallSnapshot();
    return NextResponse.json(snapshot);
  }
  if (!originAllowed(request.headers.get("origin"), requestOrigin(request.headers, request.url))) {
    return NextResponse.json({ error: "This call stream is only available from the portal" }, { status: 403 });
  }
  try {
    return await experimental_upgradeWebSocket((ws) => {
      const socket = ws as unknown as CallSocket;
      attachCallSocket(session.csrId, session.exp, socket);
      return sendCallSnapshot(socket, loadOpenCallSnapshot);
    });
  } catch {
    return NextResponse.json({ error: "This call stream is not available" }, { status: 503 });
  }
}, { auth: "required", limit: "standard" });
