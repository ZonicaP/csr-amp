"use client";

import { useEffect, useState } from "react";
import SplashScreen from "@/components/SplashScreen";

const STORAGE_KEY = "amp-splash-seen";

export default function SplashGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"show" | "exit" | "done">("show");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = window.sessionStorage.getItem(STORAGE_KEY) === "1";

    if (seen) {
      setPhase("done");
      return;
    }

    const hold = window.setTimeout(() => setPhase("exit"), reduceMotion ? 200 : 1400);
    const finish = window.setTimeout(
      () => {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
        setPhase("done");
      },
      reduceMotion ? 200 : 1750,
    );

    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(finish);
    };
  }, []);

  return (
    <>
      {children}
      {phase === "done" ? null : (
        <SplashScreen title="Customer service" exiting={phase === "exit"} />
      )}
    </>
  );
}
