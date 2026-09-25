"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import DialogCloseButton from "@/components/DialogCloseButton";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SendPaymentLink from "@/components/users/SendPaymentLink";

type VehicleDialogTab = "details" | "plan" | "payments";

function tabPanel(active: boolean) {
  return {
    gridArea: "1 / 1",
    minWidth: 0,
    visibility: active ? "visible" : "hidden",
    pointerEvents: active ? "auto" : "none",
  } as const;
}

const planColor = {
  ACTIVE: "success",
  CANCELLED: "default",
} as const;

const planTone: Record<string, { fill: string; ink: string }> = {
  "Basic Wash": { fill: "#E7F0FA", ink: "#003264" },
  "Unlimited Wash": { fill: "#0B75E1", ink: "#FFFFFF" },
  "The Works": { fill: "#D5FD6D", ink: "#181D27" },
};

function planChipSx(name: string) {
  const tone = planTone[name] ?? { fill: "#F5F6F7", ink: "#181D27" };
  return {
    height: 24,
    fontWeight: 700,
    backgroundColor: tone.fill,
    color: tone.ink,
    "& .MuiChip-label": { color: tone.ink },
  };
}

export type VehicleCardPlan = {
  id: string;
  name: string;
  status: keyof typeof planColor;
};

export type VehicleCardDetails = {
  name: string;
  plate: string | null;
  since: string | null;
  plans: VehicleCardPlan[];
  payment: "up-to-date" | "outstanding" | null;
  paymentLink: { membershipId: string; purchaseId: string } | null;
  payments?: { id: string; description: string; amount: string; date: string; failureReason: string | null }[];
  planEditor?: ReactNode;
  plateEditor?: ReactNode;
};

export default function VehicleCard({ name, plate, since, plans, payment, paymentLink, payments = [], planEditor, plateEditor }: VehicleCardDetails) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<VehicleDialogTab>("details");
  const outstanding = payment === "outstanding";

  return (
    <>
      <Paper
        elevation={0}
        role="button"
        tabIndex={0}
        aria-label={outstanding ? `${name}, payment outstanding` : name}
        onClick={() => {
          setTab("details");
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setTab("details");
            setOpen(true);
          }
        }}
        sx={{
          px: 1.5,
          py: 1.25,
          border: "1px solid #E5E7EB",
          borderRadius: 3,
          cursor: "pointer",
          transition: "border-color 0.2s, background-color 0.2s",
          "@media (hover: hover) and (min-width: 900px)": {
            "&:hover": { borderColor: "#0B75E1", backgroundColor: "rgba(11, 117, 225, 0.08)" },
          },
        }}
      >
        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: "#003264", fontWeight: 600 }}>{name}</Typography>
            <Typography sx={{ color: "#717680", fontSize: 14 }}>
              {since ? `Since ${since}` : "No membership on this vehicle."}
            </Typography>
          </Box>
          <Box sx={{ flexShrink: 0, textAlign: "right" }}>
            <Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                {outstanding ? (
                  <Box
                    aria-hidden
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      backgroundColor: "#FFA100",
                      color: "#181D27",
                      fontSize: 13,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      lineHeight: 1,
                    }}
                  >
                    !
                  </Box>
                ) : null}
                {plans[0] ? <Chip size="small" label={plans[0].name} sx={planChipSx(plans[0].name)} /> : null}
              </Stack>
              <Typography sx={{ fontSize: 14 }}>{plate ?? "No plate"}</Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>
      <Dialog
        open={open}
        onClose={() => {
          setTab("details");
          setOpen(false);
        }}
        fullWidth
        maxWidth="xs"
        sx={{
          "& .MuiDialog-container": { alignItems: { xs: "flex-end", md: "center" } },
          "& .MuiDialog-paper": {
            m: { xs: 0, md: 4 },
            width: { xs: "100%", md: "calc(100% - 64px)" },
            maxWidth: { xs: "100%", md: 444 },
            borderRadius: { xs: "16px 16px 0 0", md: 2 },
          },
        }}
      >
        <DialogTitle sx={{ color: "#003264", pb: 0 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
            <Box sx={{ minWidth: 0 }}>{name}</Box>
            <Typography component="span" sx={{ flexShrink: 0, color: "#717680", fontSize: 14, fontWeight: 600 }}>
              {plate ?? "No plate"}
            </Typography>
          </Stack>
        </DialogTitle>
        <Tabs
          value={tab}
          onChange={(_event, next: VehicleDialogTab) => setTab(next)}
          variant="fullWidth"
          sx={{
            minHeight: 40,
            px: 1,
            borderBottom: "1px solid #E5E7EB",
            "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600, fontSize: 14, color: "#717680" },
            "& .Mui-selected": { color: "#0B75E1" },
            "& .MuiTabs-indicator": { backgroundColor: "#0B75E1" },
          }}
        >
          <Tab value="details" label="Details" />
          <Tab value="plan" label="Plan" />
          <Tab value="payments" label="Payments" />
        </Tabs>
        <DialogContent sx={{ "&&": { pt: 2.5 } }}>
          <Stack spacing={1.5} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            <Box sx={{ display: "grid" }}>
              <Box aria-hidden={tab !== "details"} sx={tabPanel(tab === "details")}>
                <Stack spacing={1.5}>
                  {plateEditor ?? (
                    <Box>
                      <Typography sx={{ color: "#717680", fontSize: 14 }}>Plate</Typography>
                      <Typography sx={{ color: "#003264", fontWeight: 600 }}>{plate ?? "No plate"}</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
              <Box aria-hidden={tab !== "plan"} sx={tabPanel(tab === "plan")}>
                {planEditor ?? (
                  <Stack spacing={1.5}>
                    {plans.length === 0 ? <Typography>No plan on this vehicle.</Typography> : null}
                    {plans.map((plan) => (
                      <Typography key={plan.id}>
                        {plan.name}
                        {since ? ` since ${since}` : ""}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </Box>
              <Box aria-hidden={tab !== "payments"} sx={tabPanel(tab === "payments")}>
                {payments.length === 0 ? (
                  <Typography sx={{ color: "#717680", fontSize: 14 }}>No payments on this vehicle.</Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {payments.map((item) => (
                      <Box key={item.id}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                          <Typography sx={{ color: item.failureReason ? "#C47F00" : "#003264", fontWeight: 700, fontSize: 14 }}>
                            {item.failureReason ? "Payment outstanding" : item.description}
                          </Typography>
                          {item.failureReason && paymentLink?.purchaseId === item.id ? (
                            <SendPaymentLink membershipId={paymentLink.membershipId} purchaseId={paymentLink.purchaseId} />
                          ) : (
                            <Typography sx={{ flexShrink: 0, color: "#717680", fontSize: 13 }}>{item.amount}</Typography>
                          )}
                        </Stack>
                        <Typography sx={{ color: "#717680", fontSize: 14 }}>
                          {item.failureReason ? `Declined ${item.amount} on ${item.date}. ${item.failureReason}` : item.date}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
            <Stack direction="row" spacing={1}>
              <DialogCloseButton
                short
                onClick={() => {
                  setTab("details");
                  setOpen(false);
                }}
              />
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
