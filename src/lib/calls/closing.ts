const noteLimit = 1000;

export function closingCall(input: { gaveReference: boolean; confirmedNothingElse: boolean; notes?: string }) {
  if (input.gaveReference !== true || input.confirmedNothingElse !== true) {
    return { ok: false as const, error: "Confirm both closing steps before ending the call" as const };
  }
  const notes = (input.notes ?? "").trim().slice(0, noteLimit);
  return {
    ok: true as const,
    status: "CLOSED" as const,
    gaveReference: true as const,
    confirmedNothingElse: true as const,
    closingNotes: notes.length > 0 ? notes : null,
  };
}
