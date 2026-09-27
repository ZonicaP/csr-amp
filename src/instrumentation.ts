export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.VERCEL) {
    const { listenForDevCallSocket } = await import("./lib/calls/dev-call-socket");
    listenForDevCallSocket();
  }
}
