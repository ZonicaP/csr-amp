"use client";

import { useCallback, useState } from "react";
import { AuthRequestError } from "@/lib/auth/http-client";

export function requestErrorMessage(caught: unknown) {
  return caught instanceof AuthRequestError ? caught.message : "Something went wrong";
}

export function useFormRequest() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const run = useCallback(async <T,>(request: () => Promise<T>) => {
    setError("");
    setPending(true);
    try {
      return await request();
    } catch (caught) {
      setError(requestErrorMessage(caught));
      return undefined;
    } finally {
      setPending(false);
    }
  }, []);

  return { error, setError, pending, run };
}
