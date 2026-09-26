"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { cancelledBadgeSx } from "@/components/StatusBadge";
import VehicleDialog from "@/components/users/VehicleDialog";

type VehicleDialogTab = "details" | "plan" | "payments";

type PlanStatus = "ACTIVE" | "CANCELLED";

const planTone: Record<string, { fill: string; ink: string }> = {
  "Basic Wash": { fill: "#E7F0FA", ink: "#003264" },
  "Unlimited Wash": { fill: "#0B75E1", ink: "#FFFFFF" },
  "The Works": { fill: "#D5FD6D", ink: "#181D27" },
};

function planChipSx(name: string, status: PlanStatus) {
  if (status === "CANCELLED") return cancelledBadgeSx;
  const tone = planTone[name] ?? { fill: "#F5F6F7", ink: "#181D27" };
  return {
    height: 24,
    fontWeight: 700,
    backgroundColor: tone.fill,
    color: tone.ink,
    "& .MuiChip-label": { color: tone.ink },
  };
}

function cardBadge(plans: VehicleCardPlan[]) {
  return plans.find((plan) => plan.status === "ACTIVE") ?? plans[0] ?? null;
}

export type VehicleCardPlan = {
  id: string;
  name: string;
  status: PlanStatus;
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
  const badge = cardBadge(plans);

  return (
    <>
      <Paper
        elevation={0}
        role="button"
        tabIndex={0}
        aria-label={[name, plate, outstanding ? "payment outstanding" : null].filter(Boolean).join(", ")}
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
                {badge ? <Chip size="small" label={badge.name} sx={planChipSx(badge.name, badge.status)} /> : null}
              </Stack>
              <Typography sx={{ fontSize: 14 }}>{plate ?? "No plate"}</Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>
      <VehicleDialog
        open={open}
        tab={tab}
        onTab={setTab}
        onClose={() => {
          setTab("details");
          setOpen(false);
        }}
        name={name}
        plate={plate}
        since={since}
        plans={plans}
        payment={payment}
        paymentLink={paymentLink}
        payments={payments}
        planEditor={planEditor}
        plateEditor={plateEditor}
      />
    </>
  );
}
