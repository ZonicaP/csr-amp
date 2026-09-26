"use client";

import type { ReactNode } from "react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DialogCloseButton, { dialogFooterButton } from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import LikelyIssue from "@/components/users/LikelyIssue";
import type { AccountIssue, SuggestedAction } from "@/lib/debug/account-issue";

const frequentIssues = [
  "Payment was declined",
  "Wash didn't start",
  "Charged twice",
  "Wants to cancel",
  "Wrong plate or vehicle",
  "Plan looks wrong",
  "Coupon doesn't work",
  "Coupon expired",
  "Single wash",
  "Update my card",
  "Previous calls",
];

export type DebugAnswer = {
  likelyIssue: string;
  summary: string;
  steps: string[];
};

export default function SmartDebugDialog({
  open,
  membershipId,
  issue,
  question,
  selected,
  answer,
  error,
  pending,
  showAsk,
  showResults,
  mobile,
  step,
  reported,
  maxDiscount,
  onQuestion,
  onSelect,
  onAsk,
  onBack,
  onClose,
  actionKey,
  renderAction,
}: {
  open: boolean;
  membershipId: string;
  issue: AccountIssue;
  question: string;
  selected: string | null;
  answer: DebugAnswer | null;
  error: string | null;
  pending: boolean;
  showAsk: boolean;
  showResults: boolean;
  mobile: boolean;
  step: "ask" | "results";
  reported: SuggestedAction[];
  maxDiscount?: number | null;
  onQuestion: (value: string) => void;
  onSelect: (label: string) => void;
  onAsk: () => void;
  onBack: () => void;
  onClose: () => void;
  actionKey: (action: SuggestedAction) => string;
  renderAction: (action: SuggestedAction) => ReactNode;
}) {
  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        ...sheetDialogSx(560),
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
                onChange={(event) => onQuestion(event.target.value)}
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
                      onClick={() => onSelect(label)}
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
                onClick={onAsk}
                disabled={pending || question.trim().length === 0}
                sx={{ alignSelf: "flex-end", "&&": { minHeight: 36, py: "6px", px: 2, fontSize: 14 } }}
              >
                {pending ? "Looking" : "Debug"}
              </Button>
            </>
          ) : null}
          {showResults && pending && !answer ? <Typography sx={{ color: "#717680", fontSize: 14 }}>Looking</Typography> : null}
          {showResults && answer ? (
            <Stack spacing={1} sx={{ pt: 0.5 }}>
              <Typography sx={{ color: "#181D27", fontSize: 14 }}>{answer.summary}</Typography>
              {reported.length > 0 ? (
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                  {reported.map((action) => (
                    <span key={actionKey(action)}>{renderAction(action)}</span>
                  ))}
                </Stack>
              ) : null}
              <Typography sx={{ color: "#003264", fontWeight: 600, fontSize: 14 }}>What to do</Typography>
              {answer.steps.map((item, index) => (
                <Typography key={`${index}-${item}`} sx={{ color: "#181D27", fontSize: 14 }}>
                  {index + 1}. {item}
                </Typography>
              ))}
            </Stack>
          ) : null}
          {showResults && error ? <Typography sx={{ color: "#FA4362", fontSize: 14 }}>{error}</Typography> : null}
        </Stack>
      </DialogContent>
      <Stack spacing={1.25} sx={{ px: 3, pt: 1, pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 2 } }}>
        <LikelyIssue membershipId={membershipId} issue={issue} maxDiscount={maxDiscount} headline={answer?.likelyIssue} />
        <Stack direction="row" spacing={1}>
          {mobile && step === "results" ? (
            <Button variant="outlined" onClick={onBack} sx={{ ...dialogFooterButton, "&&": { minHeight: 36, py: "6px", fontSize: 14 } }}>
              Back
            </Button>
          ) : null}
          <DialogCloseButton short onClick={onClose} />
        </Stack>
      </Stack>
    </Dialog>
  );
}
