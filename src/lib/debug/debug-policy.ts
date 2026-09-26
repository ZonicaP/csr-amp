const windowMs = 10 * 60 * 1000;
const maxQuestions = 8;

const abuse =
  /ignore (all |any |the )?(previous|prior|above) instructions|system prompt|jailbreak|you are now|act as|developer mode|write (me )?(code|a poem|an essay|a story|python|javascript)|recipe|weather|translate this|homework|bitcoin|api key|password/i;

const membership =
  /\b(membership|member|account|customer|wash|payment|charge|charged|refund|plate|vehicle|plan|cancel|overdue|declin|card|invoice|subscription|reactivat|discount|bay|machine|visit|outstanding|twice|double|coupon|promo|calls?|callback|reference)\b|\bc-\d{5}\b/i;

const turns = new Map<string, number[]>();

export function csrQuestionAllowed(question: string) {
  const text = question.trim();
  if (!text || abuse.test(text)) return false;
  return membership.test(text);
}

export function takeDebugTurn(csrId: string, now = Date.now()) {
  const recent = (turns.get(csrId) ?? []).filter((at) => now - at < windowMs);
  if (recent.length >= maxQuestions) {
    turns.set(csrId, recent);
    const retryAfter = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
    return { ok: false as const, retryAfter };
  }
  recent.push(now);
  turns.set(csrId, recent);
  return { ok: true as const };
}

export function resetDebugTurns() {
  turns.clear();
}
