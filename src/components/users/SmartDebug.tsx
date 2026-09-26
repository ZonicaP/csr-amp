"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import AccountAction from "@/components/users/AccountAction";
import SendPaymentLink from "@/components/users/SendPaymentLink";
import SmartDebugDialog, { type DebugAnswer } from "@/components/users/SmartDebugDialog";
import { actionsForQuestion, type AccountIssue, type AccountSnapshot, type SuggestedAction } from "@/lib/debug/account-issue";

function actionKey(action: SuggestedAction) {
  if (action.type === "email-payment-link" || action.type === "refund-charge") return `${action.type}-${action.purchaseId}`;
  return action.type;
}

function IssueAction({
  membershipId,
  action,
  appearance = "link",
  onCover,
  onReveal,
  onDone,
  maxDiscount,
}: {
  membershipId: string;
  action: SuggestedAction;
  appearance?: "link" | "button";
  onCover?: () => void;
  onReveal?: () => void;
  onDone?: () => void;
  maxDiscount?: number | null;
}) {
  if (action.type === "email-payment-link") {
    return <SendPaymentLink membershipId={membershipId} purchaseId={action.purchaseId} appearance={appearance} />;
  }
  return <AccountAction membershipId={membershipId} action={action} appearance={appearance} maxDiscount={maxDiscount} onCover={onCover} onReveal={onReveal} onDone={onDone} />;
}

export default function SmartDebug({
  membershipId,
  issue,
  account,
  maxDiscount = 10,
  placement = "icon",
}: {
  membershipId: string;
  issue: AccountIssue;
  account: AccountSnapshot;
  maxDiscount?: number | null;
  placement?: "icon" | "center" | "menu";
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [answer, setAnswer] = useState<DebugAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState<"ask" | "results">("ask");
  const [covered, setCovered] = useState(false);
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const showAsk = !mobile || step === "ask";
  const showResults = !mobile || step === "results";
  const reported = actionsForQuestion(account, question);

  async function ask() {
    const text = question.trim();
    if (!text || pending) return;
    setStep("results");
    setPending(true);
    setError(null);
    setAnswer(null);
    const response = await fetch(`/api/customers/${encodeURIComponent(membershipId)}/debug`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text }),
    });
    const body = (await response.json().catch(() => null)) as (DebugAnswer & { error?: string }) | null;
    if (!response.ok || !body || typeof body.likelyIssue !== "string" || !Array.isArray(body.steps)) {
      setError(body?.error ?? "Smart debug could not reach Groq. Try again.");
      setPending(false);
      return;
    }
    setAnswer({ likelyIssue: body.likelyIssue, summary: body.summary, steps: body.steps });
    setPending(false);
  }

  return (
    <>
      {placement === "menu" ? (
        <Box
          component="button"
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            setStep("ask");
            setOpen(true);
          }}
          sx={{
            px: 1.5,
            py: 1.25,
            pl: 3,
            border: 0,
            borderRadius: "12px",
            backgroundColor: "transparent",
            color: "#003264",
            font: "inherit",
            fontWeight: 600,
            fontSize: 16,
            textAlign: "left",
            cursor: "pointer",
            "&:hover": { backgroundColor: "rgba(11, 117, 225, 0.08)" },
          }}
        >
          Smart debug
        </Box>
      ) : placement === "center" ? (
        <Box
          component="button"
          type="button"
          aria-label="Smart debug"
          onClick={() => {
            setStep("ask");
            setOpen(true);
          }}
          sx={{
            border: 0,
            background: "transparent",
            color: "#0B75E1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            font: "inherit",
            minWidth: 64,
            p: 0,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              transform: "translateY(-10px)",
              borderRadius: "50%",
              backgroundColor: "#0B75E1",
              color: "#fff",
              display: "grid",
              placeItems: "center",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M20 8h-2.81a6 6 0 0 0-1.82-1.96L17 4.41 15.59 3l-2.17 2.17A6 6 0 0 0 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63A6 6 0 0 0 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81A6 6 0 0 0 12 21a6 6 0 0 0 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"
              />
            </svg>
          </Box>
        </Box>
      ) : (
      <IconButton
        aria-label="Smart debug"
        onClick={() => {
          setStep("ask");
          setOpen(true);
        }}
        sx={{
          width: 36,
          height: 36,
          color: "#181D27",
          border: "1px solid #E5E7EB",
          borderRadius: "40px",
          "&&": { minWidth: 36, minHeight: 36, p: 0 },
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M20 8h-2.81a6 6 0 0 0-1.82-1.96L17 4.41 15.59 3l-2.17 2.17A6 6 0 0 0 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63A6 6 0 0 0 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81A6 6 0 0 0 12 21a6 6 0 0 0 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"
          />
        </svg>
      </IconButton>
      )}
      <SmartDebugDialog
        open={open && !covered}
        membershipId={membershipId}
        issue={issue}
        question={question}
        selected={selected}
        answer={answer}
        error={error}
        pending={pending}
        showAsk={showAsk}
        showResults={showResults}
        mobile={mobile}
        step={step}
        reported={reported}
        maxDiscount={maxDiscount}
        onQuestion={(value) => {
          setQuestion(value);
          setSelected(null);
        }}
        onSelect={(label) => {
          setSelected(label);
          setQuestion(label);
        }}
        onAsk={ask}
        onBack={() => setStep("ask")}
        onClose={() => setOpen(false)}
        actionKey={actionKey}
        renderAction={(action) => (
          <IssueAction
            membershipId={membershipId}
            action={action}
            appearance="button"
            onCover={() => setCovered(true)}
            onReveal={() => setCovered(false)}
            maxDiscount={maxDiscount}
            onDone={() => {
              setCovered(false);
              setOpen(false);
            }}
          />
        )}
      />
    </>
  );
}
