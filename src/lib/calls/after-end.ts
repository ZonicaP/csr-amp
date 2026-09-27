const referencePattern = /^C-\d{5}$/;

export function routeAfterCallAction(status: string | undefined, reference: string): `/calls/${string}` | "/calls" | null {
  if (status === undefined || status === "OPEN") return null;
  const normalized = reference.trim().toUpperCase();
  if (!referencePattern.test(normalized)) return "/calls";
  return `/calls/${normalized}`;
}
