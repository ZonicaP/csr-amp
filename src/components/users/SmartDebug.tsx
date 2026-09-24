"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AccountAction from "@/components/users/AccountAction";
import SendPaymentLink from "@/components/users/SendPaymentLink";
import { actionsForQuestion, type AccountIssue, type AccountSnapshot, type SuggestedAction } from "@/lib/debug/account-issue";

const frequentIssues = [
  "Payment was declined",
  "Wash didn't start",
  "Charged twice",
  "Wants to cancel",
  "Wrong plate or vehicle",
  "Plan looks wrong",
];

const barColor = {
  warning: { background: "#FFF8EB", border: "#FFA100", label: "#C47F00" },
  success: { background: "#F3FBF7", border: "#11B76B", label: "#0E8F54" },
  neutral: { background: "#F5F6F7", border: "#E5E7EB", label: "#717680" },
} as const;

function actionKey(action: SuggestedAction) {
  if (action.type === "email-payment-link" || action.type === "refund-charge") return `${action.type}-${action.purchaseId}`;
  if (action.type === "email-plate-documents") return `${action.type}-${action.vehicleId}`;
  return action.type;
}

function uniqueActions(actions: SuggestedAction[]) {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = actionKey(action);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function IssueAction({ membershipId, action }: { membershipId: string; action: SuggestedAction }) {
  if (action.type === "email-payment-link") return <SendPaymentLink membershipId={membershipId} purchaseId={action.purchaseId} />;
  return <AccountAction membershipId={membershipId} action={action} />;
}

type DebugAnswer = {
  likelyIssue: string;
  summary: string;
  steps: string[];
};

export default function SmartDebug({ membershipId, issue, account }: { membershipId: string; issue: AccountIssue; account: AccountSnapshot }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [answer, setAnswer] = useState<DebugAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const colors = barColor[issue.tone];
  const reported = actionsForQuestion(account, question);
  const likelyActions = uniqueActions(question.trim() ? [...issue.actions, ...reported] : issue.actions);

  async function ask() {
    const text = question.trim();
    if (!text || pending) return;
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
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
        sx={{ "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}
      >
        Smart debug
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-container": { alignItems: { xs: "flex-end", md: "center" } },
          "& .MuiDialog-paper": {
            m: { xs: 0, md: 4 },
            width: { xs: "100%", md: "calc(100% - 64px)" },
            maxWidth: { xs: "100%", md: 560 },
            maxHeight: { xs: "92dvh", md: "calc(100% - 64px)" },
            borderRadius: { xs: "16px 16px 0 0", md: 2 },
            display: "flex",
            flexDirection: "column",
          },
          "& .MuiDialogTitle-root + .MuiDialogContent-root": { pt: 2 },
        }}
      >
        <DialogTitle sx={{ color: "#003264", pb: 1 }}>Smart debug</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <TextField
              label="What is the customer reporting?"
              placeholder="Or pick a common issue below"
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                setSelected(null);
              }}
              multiline
              minRows={2}
              maxRows={4}
              fullWidth
            />
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {frequentIssues.map((label) => {
                const active = selected === label;
                return (
                  <Chip
                    key={label}
                    label={label}
                    variant="outlined"
                    onClick={() => {
                      setSelected(label);
                      setQuestion(label);
                    }}
                    sx={{
                      borderColor: active ? "#0B75E1" : "#E5E7EB",
                      backgroundColor: active ? "rgba(11, 117, 225, 0.08)" : "#FFFFFF",
                      color: active ? "#003264" : "#181D27",
                      fontWeight: 600,
                    }}
                  />
                );
              })}
            </Stack>
            <Button
              variant="contained"
              onClick={ask}
              disabled={pending || question.trim().length === 0}
              sx={{ alignSelf: "flex-start", "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}
            >
              {pending ? "Looking" : "Debug"}
            </Button>
            {answer ? (
              <Stack spacing={1} sx={{ pt: 0.5 }}>
                <Typography sx={{ color: "#181D27", fontSize: 14 }}>{answer.summary}</Typography>
                {reported.length > 0 ? (
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                    {reported.map((action) => (
                      <IssueAction key={actionKey(action)} membershipId={membershipId} action={action} />
                    ))}
                  </Stack>
                ) : null}
                <Typography sx={{ color: "#003264", fontWeight: 600, fontSize: 14 }}>What to do</Typography>
                {answer.steps.map((step, index) => (
                  <Typography key={`${index}-${step}`} sx={{ color: "#181D27", fontSize: 14 }}>
                    {index + 1}. {step}
                  </Typography>
                ))}
              </Stack>
            ) : null}
            {error ? (
              <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{error}</Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <Stack spacing={1.25} sx={{ px: 3, pt: 1, pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 2 } }}>
          <Box
            role="status"
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              columnGap: 1,
              alignItems: "start",
              px: 1.5,
              py: 1.25,
              borderRadius: 2,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
            }}
          >
            <Typography sx={{ gridColumn: 1, gridRow: 1, color: colors.label, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
              MOST LIKELY
            </Typography>
            {likelyActions.length > 0 ? (
              <Stack sx={{ gridColumn: 2, gridRow: { xs: 1, md: 2 }, alignItems: "flex-end", alignSelf: "center" }}>
                {likelyActions.map((action) => (
                  <IssueAction key={actionKey(action)} membershipId={membershipId} action={action} />
                ))}
              </Stack>
            ) : null}
            <Box sx={{ gridColumn: { xs: "1 / -1", md: 1 }, gridRow: 2, minWidth: 0 }}>
              <Typography sx={{ color: "#003264", fontWeight: 600, fontSize: 14 }}>{answer?.likelyIssue ?? issue.headline}</Typography>
              <Typography sx={{ color: "#717680", fontSize: 14 }}>{issue.detail}</Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={() => setOpen(false)}
            sx={{ alignSelf: "flex-start", "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}
          >
            Close
          </Button>
        </Stack>
      </Dialog>
    </>
  );
}
