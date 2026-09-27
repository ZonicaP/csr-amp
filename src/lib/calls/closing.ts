const noteLimit = 1000;

export function closingCall(input: { gaveReference: boolean; confirmedNothingElse: boolean; notes?: string }) {
  const notes = (input.notes ?? "").trim().slice(0, noteLimit);
  return {
    ok: true as const,
    status: "CLOSED" as const,
    gaveReference: input.gaveReference === true,
    confirmedNothingElse: input.confirmedNothingElse === true,
    closingNotes: notes.length > 0 ? notes : null,
  };
}
