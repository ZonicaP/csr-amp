import { liveSnapshot, publishOpenCalls, toLiveCall } from "@/lib/calls/call-stream";
import { prisma } from "@/lib/prisma";

export async function loadOpenCallSnapshot() {
  const rows = await prisma.call.findMany({
    where: { status: "OPEN" },
    select: {
      reference: true,
      csrId: true,
      csr: { select: { displayName: true } },
      user: { select: { membershipId: true } },
    },
    orderBy: { startedAt: "desc" },
  });
  return liveSnapshot(rows.map((row) => toLiveCall(row)));
}

export function publishOpenCallSnapshot() {
  return publishOpenCalls(loadOpenCallSnapshot);
}
