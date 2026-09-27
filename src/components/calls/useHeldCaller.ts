"use client";

import { useCallStream } from "@/components/calls/CallStreamProvider";
import { heldByOtherAgent, type HeldCaller } from "@/lib/calls/edit-guard";

export function useHeldCaller(membershipId: string, myReference: string | null, serverHold: HeldCaller | null) {
  const stream = useCallStream();
  return heldByOtherAgent(membershipId, myReference, serverHold, stream?.ready ? stream.calls : null);
}
