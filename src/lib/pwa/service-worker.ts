export function serviceWorkerScript(version: string) {
  return `/* amp-csr ${version} */
self.addEventListener("install", () => {
  // Keep the new worker waiting until the CSR chooses Update.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
`;
}
