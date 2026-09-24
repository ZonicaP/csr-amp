"use client";

import ErrorFallback from "@/components/ErrorFallback";
import { manrope } from "@/lib/manrope";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className={manrope.className}>
        <title>Something went wrong</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <ErrorFallback error={error} onRetry={retry} />
      </body>
    </html>
  );
}
