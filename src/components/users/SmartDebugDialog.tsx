"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@/components/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DialogCloseButton, { dialogFooterButton } from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import LikelyIssue from "@/components/users/LikelyIssue";
import type { AccountIssue, SuggestedAction } from "@/lib/debug/account-issue";

const issueGroups = [
  { id: "payment", label: "Payment", issues: ["Payment was declined", "Charged twice", "Update my card"] },
  { id: "wash", label: "Wash", issues: ["Wash didn't start", "Single wash", "Coupon doesn't work", "Coupon expired"] },
  { id: "account", label: "Account", issues: ["Wants to cancel", "Wrong plate or vehicle", "Plan looks wrong", "Previous calls"] },
] as const;

type IssueGroup = (typeof issueGroups)[number]["id"];

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
  const [group, setGroup] = useState<IssueGroup>("payment");
  const issues = issueGroups.find((item) => item.id === group)?.issues ?? issueGroups[0].issues;

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
              <Box>
                <Typography sx={{ color: "#717680", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", mb: 0.5 }}>
                  COMMON ISSUES
                </Typography>
                <Tabs
                  value={group}
                  onChange={(_event, next: IssueGroup) => setGroup(next)}
                  variant="fullWidth"
                  sx={{
                    minHeight: 40,
                    borderBottom: "1px solid #E5E7EB",
                    "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600, fontSize: 14, color: "#717680" },
                    "& .Mui-selected": { color: "#0B75E1" },
                    "& .MuiTabs-indicator": { backgroundColor: "#0B75E1" },
                  }}
                >
                  {issueGroups.map((item) => (
                    <Tab key={item.id} value={item.id} label={item.label} />
                  ))}
                </Tabs>
                <Stack role="listbox" aria-label="Common issues" spacing={0.25} sx={{ pt: 0.75 }}>
                  {issues.map((label) => {
                    const active = selected === label;
                    return (
                      <Box
                        key={label}
                        component="button"
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => onSelect(label)}
                        sx={{
                          minHeight: 36,
                          px: 1.5,
                          py: 0.75,
                          border: 0,
                          borderRadius: "12px",
                          backgroundColor: active ? "rgba(11, 117, 225, 0.1)" : "transparent",
                          color: active ? "#0B75E1" : "#003264",
                          font: "inherit",
                          fontWeight: 600,
                          fontSize: 14,
                          textAlign: "left",
                          cursor: "pointer",
                          "&:hover": { backgroundColor: active ? "rgba(11, 117, 225, 0.1)" : "rgba(11, 117, 225, 0.08)" },
                        }}
                      >
                        {label}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
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
