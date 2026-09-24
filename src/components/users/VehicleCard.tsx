"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SendPaymentLink from "@/components/users/SendPaymentLink";

const planColor = {
  ACTIVE: "success",
  CANCELLED: "default",
} as const;

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
  failure: { reason: string; amount: string; date: string } | null;
  lastPayment: { amount: string; date: string } | null;
  paymentLink: { membershipId: string; purchaseId: string } | null;
};

export default function VehicleCard({ name, plate, since, plans, payment, failure, lastPayment, paymentLink }: VehicleCardDetails) {
  const [open, setOpen] = useState(false);
  const outstanding = payment === "outstanding";

  return (
    <>
      <Paper
        elevation={0}
        role="button"
        tabIndex={0}
        aria-label={outstanding ? `${name}, payment outstanding` : name}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
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
                {plans.map((plan) => (
                  <Chip key={plan.id} size="small" label={plan.name} color={planColor[plan.status]} />
                ))}
              </Stack>
              <Typography sx={{ fontSize: 14 }}>{plate ?? "No plate"}</Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
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
        <DialogTitle sx={{ color: "#003264" }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
            <Box sx={{ minWidth: 0 }}>{name}</Box>
            <Typography component="span" sx={{ flexShrink: 0, color: "#717680", fontSize: 14, fontWeight: 600 }}>
              {plate ?? "No plate"}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 1 } }}>
            {plans.length === 0 ? <Typography>No membership on this vehicle.</Typography> : null}
            {plans.map((plan) => (
              <Typography key={plan.id}>
                {plan.name}
                {since ? ` since ${since}` : ""}
              </Typography>
            ))}
            {payment === "up-to-date" ? (
              <Typography sx={{ pt: 1, borderTop: "1px solid #E5E7EB", color: "#11B76B", fontWeight: 600 }}>
                Up to date
              </Typography>
            ) : null}
            {outstanding ? (
              <Box sx={{ pt: 1.25, borderTop: "1px solid #E5E7EB" }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                  <Typography sx={{ color: "#C47F00", fontWeight: 700, fontSize: 14 }}>Payment outstanding</Typography>
                  {paymentLink ? <SendPaymentLink membershipId={paymentLink.membershipId} purchaseId={paymentLink.purchaseId} /> : null}
                </Stack>
                {failure ? (
                  <Typography sx={{ color: "#717680", fontSize: 14 }}>
                    Declined {failure.amount} on {failure.date}. {failure.reason}
                  </Typography>
                ) : null}
              </Box>
            ) : null}
            {lastPayment ? (
              <Box sx={{ pt: 1.25, borderTop: "1px solid #E5E7EB" }}>
                <Typography sx={{ color: "#003264", fontWeight: 700, fontSize: 14 }}>Last payment received</Typography>
                <Typography sx={{ color: "#717680", fontSize: 14 }}>
                  {lastPayment.amount} on {lastPayment.date}
                </Typography>
              </Box>
            ) : null}
            <Button
              variant="contained"
              onClick={() => setOpen(false)}
              sx={{ alignSelf: "flex-end", mt: 1, minHeight: 36, py: "6px", px: 2 }}
            >
              Close
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
