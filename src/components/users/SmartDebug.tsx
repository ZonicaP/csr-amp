"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
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

function IssueAction({
  membershipId,
  action,
  appearance = "link",
  onCover,
  onReveal,
  onDone,
}: {
  membershipId: string;
  action: SuggestedAction;
  appearance?: "link" | "button";
  onCover?: () => void;
  onReveal?: () => void;
  onDone?: () => void;
}) {
  if (action.type === "email-payment-link") {
    return <SendPaymentLink membershipId={membershipId} purchaseId={action.purchaseId} appearance={appearance} />;
  }
  return <AccountAction membershipId={membershipId} action={action} appearance={appearance} onCover={onCover} onReveal={onReveal} onDone={onDone} />;
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
  const [step, setStep] = useState<"ask" | "results">("ask");
  const [covered, setCovered] = useState(false);
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const showAsk = !mobile || step === "ask";
  const showResults = !mobile || step === "results";
  const colors = barColor[issue.tone];
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
      <Dialog
        open={open && !covered}
        keepMounted
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
            {showAsk ? (
              <>
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
              </>
            ) : null}
            {showResults && pending && !answer ? (
              <Typography sx={{ color: "#717680", fontSize: 14 }}>Looking</Typography>
            ) : null}
            {showResults && answer ? (
              <Stack spacing={1} sx={{ pt: 0.5 }}>
                <Typography sx={{ color: "#181D27", fontSize: 14 }}>{answer.summary}</Typography>
                {reported.length > 0 ? (
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                    {reported.map((action) => (
                      <IssueAction
                        key={actionKey(action)}
                        membershipId={membershipId}
                        action={action}
                        appearance="button"
                        onCover={() => setCovered(true)}
                        onReveal={() => setCovered(false)}
                        onDone={() => {
                          setCovered(false);
                          setOpen(false);
                        }}
                      />
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
            {showResults && error ? (
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
            {issue.actions.length > 0 ? (
              <Stack sx={{ gridColumn: 2, gridRow: { xs: 1, md: 2 }, alignItems: "flex-end", alignSelf: "center" }}>
                {issue.actions.map((action) => (
                  <IssueAction key={actionKey(action)} membershipId={membershipId} action={action} />
                ))}
              </Stack>
            ) : null}
            <Box sx={{ gridColumn: { xs: "1 / -1", md: 1 }, gridRow: 2, minWidth: 0 }}>
              <Typography sx={{ color: "#003264", fontWeight: 600, fontSize: 14 }}>{answer?.likelyIssue ?? issue.headline}</Typography>
              <Typography sx={{ color: "#717680", fontSize: 14 }}>{issue.detail}</Typography>
            </Box>
          </Box>
          <Stack direction="row" sx={{ justifyContent: mobile && step === "results" ? "space-between" : "flex-end" }}>
            {mobile && step === "results" ? (
              <Button
                variant="outlined"
                onClick={() => setStep("ask")}
                sx={{ "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}
              >
                Back
              </Button>
            ) : null}
            <Button
              variant="outlined"
              onClick={() => setOpen(false)}
              sx={{ "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}
            >
              Close
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    </>
  );
}
