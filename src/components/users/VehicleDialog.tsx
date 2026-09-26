"use client";

import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import DialogCloseButton from "@/components/DialogCloseButton";
import { sheetDialogSx } from "@/components/sheetDialog";
import SendPaymentLink from "@/components/users/SendPaymentLink";
import type { VehicleCardDetails } from "@/components/users/VehicleCard";

type VehicleDialogTab = "details" | "plan" | "payments";

function tabPanel(active: boolean) {
  return {
    gridArea: "1 / 1",
    minWidth: 0,
    visibility: active ? "visible" : "hidden",
    pointerEvents: active ? "auto" : "none",
  } as const;
}

export default function VehicleDialog({
  open,
  tab,
  onTab,
  onClose,
  name,
  plate,
  since,
  plans,
  payments = [],
  paymentLink,
  planEditor,
  plateEditor,
}: VehicleCardDetails & {
  open: boolean;
  tab: VehicleDialogTab;
  onTab: (tab: VehicleDialogTab) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" sx={sheetDialogSx(444)}>
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
        onChange={(_event, next: VehicleDialogTab) => onTab(next)}
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
              <PaymentList payments={payments} paymentLink={paymentLink} />
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <DialogCloseButton short onClick={onClose} />
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function PaymentList({
  payments,
  paymentLink,
}: {
  payments: NonNullable<VehicleCardDetails["payments"]>;
  paymentLink: VehicleCardDetails["paymentLink"];
}) {
  if (payments.length === 0) return <Typography sx={{ color: "#717680", fontSize: 14 }}>No payments on this vehicle.</Typography>;
  return (
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
  );
}
