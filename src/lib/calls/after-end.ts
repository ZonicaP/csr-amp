export function destinationAfterCallEnds(pathname: string): "/customers" | "/calls" | null {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (/^\/customers\/[^/]+/.test(path)) return "/customers";
  if (path === "/calls" || path.startsWith("/calls/")) return null;
  return "/calls";
}

export function routeAfterCallAction(pathname: string, status: string | undefined): "/customers" | "/calls" | null {
  if (status === undefined || status === "OPEN") return null;
  return destinationAfterCallEnds(pathname);
}
